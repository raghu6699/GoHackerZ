import fs from "fs";
import path from "path";
import { prisma, isDbAvailable } from "./prisma";

export interface HostHackathonProposal {
  id: string;
  refNumber: string; // e.g. "GH-HOST-49F1"
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactHandle?: string;
  hackathonTitle: string;
  targetDates?: string;
  expectedParticipants?: string;
  estimatedPrizePool?: string;
  tracksAndGoals?: string;
  specialRequirements?: string;
  status: "PENDING" | "REVIEWED" | "APPROVED" | "DECLINED";
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROPOSALS_FILE = path.join(DATA_DIR, "host-proposals.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn("[host-proposals] Could not create data directory:", e);
    }
  }
}

// Global in-memory cache
const memoryProposals: Map<string, HostHackathonProposal> =
  (globalThis as unknown as { _ghHostProposals?: Map<string, HostHackathonProposal> })
    ._ghHostProposals ||
  (() => {
    const store = new Map<string, HostHackathonProposal>();
    (
      globalThis as unknown as { _ghHostProposals?: Map<string, HostHackathonProposal> }
    )._ghHostProposals = store;
    return store;
  })();

let _tableEnsured = false;
async function ensureDbTable() {
  if (_tableEnsured || !isDbAvailable()) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HackathonHostProposal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "refNumber" TEXT NOT NULL UNIQUE,
        "orgName" TEXT NOT NULL,
        "contactName" TEXT NOT NULL,
        "contactEmail" TEXT NOT NULL,
        "contactHandle" TEXT,
        "hackathonTitle" TEXT NOT NULL,
        "targetDates" TEXT,
        "expectedParticipants" TEXT,
        "estimatedPrizePool" TEXT,
        "tracksAndGoals" TEXT,
        "specialRequirements" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    _tableEnsured = true;
  } catch (e) {
    console.warn("[host-proposals] DB table ensure notice:", e);
  }
}

export function loadPersistedHostProposals(): HostHackathonProposal[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PROPOSALS_FILE)) return [];
    const raw = fs.readFileSync(PROPOSALS_FILE, "utf-8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("[host-proposals] Read error:", e);
    return [];
  }
}

function writeProposalsToDisk(proposals: HostHackathonProposal[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals, null, 2), "utf-8");
  } catch (e) {
    console.warn("[host-proposals] Disk write error:", e);
  }
}

export function generateHostRefNumber(): string {
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `GH-HOST-${hex}`;
}

export async function saveHostProposal(
  data: Omit<HostHackathonProposal, "id" | "refNumber" | "createdAt" | "status">
): Promise<HostHackathonProposal> {
  const refNumber = generateHostRefNumber();
  const id = `prop-${Date.now()}-${refNumber.toLowerCase()}`;
  const now = new Date().toISOString();

  const proposal: HostHackathonProposal = {
    id,
    refNumber,
    orgName: data.orgName.trim(),
    contactName: data.contactName.trim(),
    contactEmail: data.contactEmail.trim().toLowerCase(),
    contactHandle: data.contactHandle?.trim() || undefined,
    hackathonTitle: data.hackathonTitle.trim(),
    targetDates: data.targetDates?.trim() || undefined,
    expectedParticipants: data.expectedParticipants || "100-300",
    estimatedPrizePool: data.estimatedPrizePool?.trim() || undefined,
    tracksAndGoals: data.tracksAndGoals?.trim() || undefined,
    specialRequirements: data.specialRequirements?.trim() || undefined,
    status: "PENDING",
    createdAt: now,
  };

  // 1. Memory cache
  memoryProposals.set(proposal.id, proposal);

  // 2. Disk JSON
  const all = loadPersistedHostProposals();
  all.unshift(proposal);
  writeProposalsToDisk(all);

  // 3. PostgreSQL Database
  if (isDbAvailable()) {
    try {
      await ensureDbTable();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "HackathonHostProposal" 
         ("id", "refNumber", "orgName", "contactName", "contactEmail", "contactHandle", "hackathonTitle", "targetDates", "expectedParticipants", "estimatedPrizePool", "tracksAndGoals", "specialRequirements", "status", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT ("refNumber") DO NOTHING`,
        proposal.id,
        proposal.refNumber,
        proposal.orgName,
        proposal.contactName,
        proposal.contactEmail,
        proposal.contactHandle ?? null,
        proposal.hackathonTitle,
        proposal.targetDates ?? null,
        proposal.expectedParticipants ?? null,
        proposal.estimatedPrizePool ?? null,
        proposal.tracksAndGoals ?? null,
        proposal.specialRequirements ?? null,
        proposal.status,
        new Date(proposal.createdAt)
      );
    } catch (dbErr) {
      console.warn("[saveHostProposal] DB insert notice:", dbErr);
    }
  }

  return proposal;
}

export async function getAllHostProposals(): Promise<HostHackathonProposal[]> {
  const diskList = loadPersistedHostProposals();
  const map = new Map<string, HostHackathonProposal>();

  for (const p of diskList) {
    map.set(p.id, p);
  }
  for (const p of memoryProposals.values()) {
    map.set(p.id, p);
  }

  if (isDbAvailable()) {
    try {
      await ensureDbTable();
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "HackathonHostProposal" ORDER BY "createdAt" DESC`
      );
      for (const r of rows) {
        map.set(r.id, {
          id: r.id,
          refNumber: r.refNumber,
          orgName: r.orgName,
          contactName: r.contactName,
          contactEmail: r.contactEmail,
          contactHandle: r.contactHandle ?? undefined,
          hackathonTitle: r.hackathonTitle,
          targetDates: r.targetDates ?? undefined,
          expectedParticipants: r.expectedParticipants ?? undefined,
          estimatedPrizePool: r.estimatedPrizePool ?? undefined,
          tracksAndGoals: r.tracksAndGoals ?? undefined,
          specialRequirements: r.specialRequirements ?? undefined,
          status: r.status as any,
          createdAt: new Date(r.createdAt).toISOString(),
        });
      }
    } catch (e) {
      console.warn("[getAllHostProposals] DB query notice:", e);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateHostProposalStatus(
  idOrRef: string,
  newStatus: "PENDING" | "REVIEWED" | "APPROVED" | "DECLINED"
): Promise<HostHackathonProposal | null> {
  const all = await getAllHostProposals();
  const found = all.find(
    (p) => p.id === idOrRef || p.refNumber.toUpperCase() === idOrRef.toUpperCase()
  );
  if (!found) return null;

  found.status = newStatus;
  memoryProposals.set(found.id, found);

  const diskList = loadPersistedHostProposals();
  const idx = diskList.findIndex((p) => p.id === found.id || p.refNumber === found.refNumber);
  if (idx >= 0) {
    diskList[idx] = found;
  } else {
    diskList.push(found);
  }
  writeProposalsToDisk(diskList);

  if (isDbAvailable()) {
    try {
      await ensureDbTable();
      await prisma.$executeRawUnsafe(
        `UPDATE "HackathonHostProposal" SET "status" = $1 WHERE "id" = $2 OR "refNumber" = $3`,
        newStatus,
        found.id,
        found.refNumber
      );
    } catch (e) {
      console.warn("[updateHostProposalStatus] DB update notice:", e);
    }
  }

  return found;
}
