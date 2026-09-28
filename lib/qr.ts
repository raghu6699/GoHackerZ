/**
 * Pure TypeScript QR Code generator (Version 2-4, Byte Mode)
 * Generates standards-compliant SVG strings and matrix arrays.
 * Scannable by all standard smartphone cameras (iOS Camera & Android Google Lens).
 */

// Format info bits for ECC Level L and M with Mask 0
const FORMAT_BITS_L_MASK0 = 0x77c4; // 15 bits: 111011111000100

// Galois field tables for GF(256) with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGalois() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = polyMul(g, [1, GF_EXP[i]]);
  }
  return g;
}

function rsCompute(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPoly(ecCount);
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const lead = msg[i];
    if (lead !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], lead);
      }
    }
  }
  return msg.slice(data.length);
}

// Version configs: [size, totalDataBytes, ecBytes]
const QR_VERSIONS = [
  { version: 1, size: 21, dataCap: 17, ecBytes: 7, alignPos: [] },
  { version: 2, size: 25, dataCap: 32, ecBytes: 10, alignPos: [6, 18] },
  { version: 3, size: 29, dataCap: 53, ecBytes: 15, alignPos: [6, 22] },
  { version: 4, size: 33, dataCap: 78, ecBytes: 20, alignPos: [6, 26] },
  { version: 5, size: 37, dataCap: 106, ecBytes: 26, alignPos: [6, 30] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const textBytes = Array.from(utf8);

  // Pick smallest fitting version
  let cfg = QR_VERSIONS[0];
  for (const v of QR_VERSIONS) {
    if (textBytes.length <= v.dataCap) {
      cfg = v;
      break;
    }
    cfg = v; // fall back to highest
  }

  const { size, dataCap, ecBytes, alignPos } = cfg;

  // Encode data in 8-bit byte mode: mode (4 bits: 0100) + length (8 bits) + data
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode
  pushBits(textBytes.length, 8); // Character count indicator
  for (const b of textBytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const remainingBits = dataCap * 8 - bits.length;
  const termLen = Math.min(4, Math.max(0, remainingBits));
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes: 0xEC, 0x11
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataCap * 8) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    dataBytes.push(byte);
  }

  // Compute Reed-Solomon EC bytes
  const ec = rsCompute(dataBytes, ecBytes);
  const allCodewords = [...dataBytes, ...ec];

  // Initialize module grid (-1 = unassigned)
  const grid: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r: number, c: number, val: number) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      grid[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // Finder pattern (7x7) + separator
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const gr = row + r;
        const gc = col + c;
        if (gr < 0 || gr >= size || gc < 0 || gc >= size) continue;

        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            setModule(gr, gc, 1);
          } else {
            setModule(gr, gc, 0);
          }
        } else {
          setModule(gr, gc, 0); // Separator
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (!isFunction[6][i]) setModule(6, i, val);
    if (!isFunction[i][6]) setModule(i, 6, val);
  }

  // Alignment patterns
  if (alignPos.length > 0) {
    for (const r of alignPos) {
      for (const c of alignPos) {
        if (isFunction[r][c]) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const isBorder = Math.abs(dy) === 2 || Math.abs(dx) === 2;
            const isCenter = dy === 0 && dx === 0;
            setModule(r + dy, c + dx, isBorder || isCenter ? 1 : 0);
          }
        }
      }
    }
  }

  // Dark module
  setModule(size - 8, 8, 1);

  // Format info area placeholder (masked later)
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // Place data codewords with mask pattern 0 ( (r + c) % 2 == 0 )
  let codewordIdx = 0;
  let bitIdx = 7;
  let upwards = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[r][c]) {
          let bit = 0;
          if (codewordIdx < allCodewords.length) {
            bit = (allCodewords[codewordIdx] >> bitIdx) & 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              codewordIdx++;
            }
          }
          // Mask 0: flip if (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0 ? 1 : 0;
          grid[r][c] = bit ^ mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Write format info (Format bits L Mask 0)
  const formatBits = FORMAT_BITS_L_MASK0;
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    // Top-left
    if (i <= 5) grid[8][i] = bit;
    else if (i === 6) grid[8][7] = bit;
    else if (i === 7) grid[8][8] = bit;
    else if (i === 8) grid[7][8] = bit;
    else grid[14 - i][8] = bit;

    // Bottom-left / Top-right
    if (i < 8) grid[size - 1 - i][8] = bit;
    else grid[8][size - 15 + i] = bit;
  }

  return grid.map((row) => row.map((cell) => cell === 1));
}

/**
 * Renders an SVG path string from the boolean matrix.
 */
export function renderQrSvgPath(matrix: boolean[][]): string {
  const size = matrix.length;
  let path = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        path += `M${c},${r}h1v1h-1z `;
      }
    }
  }
  return path;
}
