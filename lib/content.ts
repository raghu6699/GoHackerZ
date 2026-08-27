/**
 * Content pipeline — the single source of truth for how GoHackerz articles are
 * parsed, serialized and rendered inline. Used by the API route (storage),
 * the TipTap editor (load + save) and ArticleBody (render), and unit-tested.
 */
import type { Block } from "./data";

// ── Inline markdown tokens ─────────────────────────────────────
// Stored paragraph/heading/quote text supports **bold**, *italic*,
// `code` and [label](https://url). Parsed to tokens so React renders
// it with automatic escaping — XSS-safe by construction.

export type InlineToken =
  | { t: "text"; v: string }
  | { t: "strong"; v: string }
  | { t: "em"; v: string }
  | { t: "code"; v: string }
  | { t: "link"; v: string; href: string }
  | { t: "footref"; id: string };

const INLINE_RE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[\^[A-Za-z0-9_-]+\])|(\[[^\]\n]+\]\([^)\s]+\))/g;

export function parseInline(s: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const m of s.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) tokens.push({ t: "text", v: s.slice(last, idx) });
    const tok = m[0];
    if (tok.startsWith("`")) {
      tokens.push({ t: "code", v: tok.slice(1, -1) });
    } else if (tok.startsWith("**")) {
      tokens.push({ t: "strong", v: tok.slice(2, -2) });
    } else if (tok.startsWith("[^")) {
      tokens.push({ t: "footref", id: tok.slice(2, -1) });
    } else if (tok.startsWith("*")) {
      tokens.push({ t: "em", v: tok.slice(1, -1) });
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (link) tokens.push({ t: "link", v: link[1], href: link[2] });
      else tokens.push({ t: "text", v: tok });
    }
    last = idx + tok.length;
  }
  if (last < s.length) tokens.push({ t: "text", v: s.slice(last) });
  return tokens;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineToHtml(s: string): string {
  return parseInline(s)
    .map((tok) => {
      switch (tok.t) {
        case "strong":
          return `<strong>${escapeHtml(tok.v)}</strong>`;
        case "em":
          return `<em>${escapeHtml(tok.v)}</em>`;
        case "code":
          return `<code>${escapeHtml(tok.v)}</code>`;
        case "link":
          return `<a href="${escapeHtml(tok.href)}">${escapeHtml(tok.v)}</a>`;
        case "footref":
          return `<sup><a href="#fn-${escapeHtml(tok.id)}">[${escapeHtml(tok.id)}]</a></sup>`;
        default:
          return escapeHtml(tok.v);
      }
    })
    .join("");
}

// ── Markdown-ish text → Block[] (storage format) ──────────────
//   ## heading → h2 · > text → quote · - item → ul · ```lang fenced → code
//   ![alt](src "caption") on its own line → img
//   [^id]: definition text lines (collected into a trailing footnotes block)

const IMG_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const FOOTNOTE_DEF_RE = /^\[\^([A-Za-z0-9_-]+)\]:\s*(.*)$/;

export function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const footnotes = new Map<string, string>();
  let para: string[] = [];
  let list: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      if (!inCode) {
        inCode = true;
        codeLang = line.trim().slice(3).trim() || "text";
        codeLines = [];
      } else {
        blocks.push({ type: "code", lang: codeLang, code: codeLines.join("\n") });
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    const t = line.trim();
    if (!t) {
      flushPara();
      flushList();
      continue;
    }

    // Standalone footnote definition — collected, not a visible paragraph.
    const fnDef = FOOTNOTE_DEF_RE.exec(t);
    if (fnDef && !inCode) {
      flushPara();
      flushList();
      footnotes.set(fnDef[1], fnDef[2]);
      continue;
    }

    // Standalone image line.
    const img = IMG_LINE_RE.exec(t);
    if (img) {
      flushPara();
      flushList();
      blocks.push({ type: "img", alt: img[1], src: img[2], caption: img[3] });
      continue;
    }

    if (t.startsWith("- ") || t.startsWith("* ")) {
      flushPara();
      list.push(t.slice(2));
    } else if (t.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h2", text: t.slice(3) });
    } else if (t.startsWith("> ")) {
      flushPara();
      flushList();
      blocks.push({ type: "quote", text: t.slice(2) });
    } else {
      flushList();
      para.push(t);
    }
  }
  flushPara();
  flushList();
  if (inCode && codeLines.length) {
    blocks.push({ type: "code", lang: codeLang, code: codeLines.join("\n") });
  }
  if (footnotes.size > 0) {
    blocks.push({
      type: "footnotes",
      items: [...footnotes.entries()].map(([id, text]) => ({ id, text })),
    });
  }
  return blocks;
}

/** Block[] → markdown-ish plain text (used by drafts UI + tests). */
export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "h2") return `## ${b.text}`;
      if (b.type === "quote") return `> ${b.text}`;
      if (b.type === "ul") return b.items.map((i) => `- ${i}`).join("\n");
      if (b.type === "code") return "```" + b.lang + "\n" + b.code + "\n```";
      if (b.type === "img")
        return `![${b.alt}](${b.src}${b.caption ? ` "${b.caption}"` : ""})`;
      if (b.type === "footnotes")
        return b.items.map((f) => `[^${f.id}]: ${f.text}`).join("\n\n");
      return b.text;
    })
    .join("\n\n");
}

/** Block[] → TipTap-compatible HTML (editor initial content). */
export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h2":
          return `<h2>${inlineToHtml(b.text)}</h2>`;
        case "quote":
          return `<blockquote><p>${inlineToHtml(b.text)}</p></blockquote>`;
        case "ul":
          return `<ul>${b.items.map((i) => `<li>${inlineToHtml(i)}</li>`).join("")}</ul>`;
        case "code":
          return `<pre><code class="language-${escapeHtml(b.lang)}">${escapeHtml(b.code)}</code></pre>`;
        case "img":
          return `<p><img src="${escapeHtml(b.src)}" alt="${escapeHtml(b.alt)}"${b.caption ? ` title="${escapeHtml(b.caption)}"` : ""} /></p>`;
        case "footnotes":
          // Footnote definitions live in storage, not in the editor body.
          return "";
        default:
          return `<p>${inlineToHtml(b.text)}</p>`;
      }
    })
    .join("");
}

// ── Table of contents helpers ──────────────────────────────────
// Long articles get Medium-style section navigation: an inline contents
// card plus a sticky top strip. Both need (a) clean plain-text labels even
// when headings contain inline markdown, and (b) ids that match what
// ArticleBody stamps onto the rendered <h2> elements.

/** Strip inline markdown (**bold**, *em*, `code`, links, footnote refs) to plain text. */
export function stripInlineMarkup(s: string): string {
  const plain = parseInline(s)
    .map((tok) => (tok.t === "link" ? tok.v : tok.t === "footref" ? "" : tok.v))
    .join("");
  // Footnote refs vanish mid-string — collapse the leftover double spaces.
  return plain.replace(/\s+/g, " ").trim();
}

export interface TocHeading {
  /** DOM id ArticleBody gives this heading: `section-<blockIndex>`. */
  id: string;
  /** Plain-text label safe for TOC display. */
  text: string;
}

/**
 * Section outline of an article: one entry per h2 block, in reading order.
 * Ids are derived from block indexes so they stay stable across renders and
 * always agree with the anchors ArticleBody renders.
 */
export function extractHeadings(content: Block[]): TocHeading[] {
  const out: TocHeading[] = [];
  for (let i = 0; i < content.length; i++) {
    const b = content[i];
    if (b.type !== "h2") continue;
    const text = stripInlineMarkup(b.text);
    if (text) out.push({ id: `section-${i}`, text });
  }
  return out;
}

// ── TipTap JSON → markdown-ish text (editor save path) ────────

interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown> | null;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> | null }[];
}

function wrapMark(out: string, open: string, close: string): string {
  // Keep surrounding whitespace outside the markers: "*and*" not "*and *"
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(out);
  return `${m?.[1] ?? ""}${open}${m?.[2] ?? out}${close}${m?.[3] ?? ""}`;
}

function renderMarks(text: string, marks?: TiptapNode["marks"]): string {
  let out = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") out = wrapMark(out, "**", "**");
  }
  for (const m of marks ?? []) {
    if (m.type === "italic") out = wrapMark(out, "*", "*");
  }
  for (const m of marks ?? []) {
    if (m.type === "code") out = wrapMark(out, "`", "`");
  }
  for (const m of marks ?? []) {
    if (m.type === "link")
      out = `[${wrapMark(out, "", "").trim()}](${(m.attrs?.href as string) ?? ""})`;
  }
  return out;
}

function inlineOf(node: TiptapNode): string {
  let s = "";
  for (const child of node.content ?? []) {
    if (child.type === "text") s += renderMarks(child.text ?? "", child.marks);
    else if (child.type === "hardBreak") s += "\n";
    else s += inlineOf(child);
  }
  return s;
}

function codeTextOf(node: TiptapNode): string {
  return (node.content ?? [])
    .map((c) => (c.type === "text" ? (c.text ?? "") : ""))
    .join("");
}

/** Serialize a ProseMirror doc into the storage text format parseBlocks reads. */
export function serializeTiptapDoc(doc: TiptapNode): string {
  const out: string[] = [];
  const walk = (n: TiptapNode) => {
    switch (n.type) {
      case "heading": {
        const level = Number(n.attrs?.level ?? 2);
        out.push(`${"#".repeat(Math.min(Math.max(level, 1), 3))} ${inlineOf(n)}`);
        break;
      }
      case "paragraph":
        out.push(inlineOf(n));
        break;
      case "blockquote":
        for (const child of n.content ?? []) out.push(`> ${inlineOf(child)}`);
        break;
      case "bulletList": {
        const items = (n.content ?? []).map((li) => `- ${inlineOf(li)}`);
        if (items.length) out.push(items.join("\n"));
        break;
      }
      case "orderedList": {
        let i = Number(n.attrs?.start ?? 1);
        const numbered = (n.content ?? []).map((li) => `${i++}. ${inlineOf(li)}`);
        if (numbered.length) out.push(numbered.join("\n"));
        break;
      }
      case "codeBlock": {
        const lang = String(n.attrs?.language ?? "") || "text";
        out.push("```" + lang + "\n" + codeTextOf(n) + "\n```");
        break;
      }
      case "image": {
        const src = String(n.attrs?.src ?? "");
        if (!src) break;
        const alt = String(n.attrs?.alt ?? "");
        const caption = n.attrs?.title ? String(n.attrs.title) : null;
        out.push(`![${alt}](${src}${caption ? ` "${caption}"` : ""})`);
        break;
      }
      default:
        for (const child of n.content ?? []) walk(child);
    }
  };
  for (const child of doc.content ?? []) walk(child);
  return out.join("\n\n");
}

