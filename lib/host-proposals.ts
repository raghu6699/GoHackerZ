import fs from "fs";
import path from "path";
import { prisma, isDbAvailable } from "./prisma";
import {
  savePersistedCustomHackathon,
  FLAGSHIP_HACKATHON,
  type HackathonData,
} from "./hackathons";
import { sendEmail, hostProposalApprovedEmail } from "./mailer";
import { persistHackathonStatus, ensureTablesExist } from "./participant-store";

export interface HostHackathonProposal {
  id: string;
  refNumber: string; // e.g. "GH-HOST-49F1"
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactHandle?: string;
  hackathonTitle: string;
  eventFormat?: string; // e.g. "3-hours", "5-hours", "single-day", "weekend-48h", "multi-day", "async-marathon"
  targetDates?: string;
  expectedParticipants?: string;
  estimatedPrizePool?: string;
  tracksAndGoals?: string;
  agenda?: string;
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
        "eventFormat" TEXT,
        "targetDates" TEXT,
        "expectedParticipants" TEXT,
        "estimatedPrizePool" TEXT,
        "tracksAndGoals" TEXT,
        "agenda" TEXT,
        "specialRequirements" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "HackathonHostProposal" ADD COLUMN IF NOT EXISTS "eventFormat" TEXT;
        ALTER TABLE "HackathonHostProposal" ADD COLUMN IF NOT EXISTS "agenda" TEXT;
      `);
    } catch {}
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
    eventFormat: data.eventFormat?.trim() || undefined,
    targetDates: data.targetDates?.trim() || undefined,
    expectedParticipants: data.expectedParticipants || "100-300",
    estimatedPrizePool: data.estimatedPrizePool?.trim() || undefined,
    tracksAndGoals: data.tracksAndGoals?.trim() || undefined,
    agenda: data.agenda?.trim() || undefined,
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
         ("id", "refNumber", "orgName", "contactName", "contactEmail", "contactHandle", "hackathonTitle", "eventFormat", "targetDates", "expectedParticipants", "estimatedPrizePool", "tracksAndGoals", "agenda", "specialRequirements", "status", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT ("refNumber") DO NOTHING`,
        proposal.id,
        proposal.refNumber,
        proposal.orgName,
        proposal.contactName,
        proposal.contactEmail,
        proposal.contactHandle ?? null,
        proposal.hackathonTitle,
        proposal.eventFormat ?? null,
        proposal.targetDates ?? null,
        proposal.expectedParticipants ?? null,
        proposal.estimatedPrizePool ?? null,
        proposal.tracksAndGoals ?? null,
        proposal.agenda ?? null,
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
          eventFormat: r.eventFormat ?? undefined,
          targetDates: r.targetDates ?? undefined,
          expectedParticipants: r.expectedParticipants ?? undefined,
          estimatedPrizePool: r.estimatedPrizePool ?? undefined,
          tracksAndGoals: r.tracksAndGoals ?? undefined,
          agenda: r.agenda ?? undefined,
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

export function parseProposalTracks(proposal: {
  tracksAndGoals?: string;
  estimatedPrizePool?: string;
  orgName: string;
  hackathonTitle: string;
}) {
  let tracks = [
    {
      id: "ai-track",
      title: "AI & Autonomous Systems",
      prize: proposal.estimatedPrizePool ? `${proposal.estimatedPrizePool} (AI Division)` : "Cash Grant + Cloud Credits",
      description: "Build cutting-edge autonomous agents and AI-powered workflows.",
      tags: ["AI", "Agents", "LangChain", "LLMs"],
    },
    {
      id: "edge-track",
      title: "Edge & High-Performance Web",
      prize: proposal.estimatedPrizePool ? `${proposal.estimatedPrizePool} (Web Division)` : "Cash Grant + Cloud Credits",
      description: "Ultra-low latency web apps, realtime architectures, and local-first systems.",
      tags: ["Edge", "Next.js", "Realtime", "TypeScript"],
    },
    {
      id: "open-track",
      title: "Open Innovation & Developer Tools",
      prize: proposal.estimatedPrizePool ? `${proposal.estimatedPrizePool} (Open Division)` : "Cash Grant + Cloud Credits",
      description: "Build developer productivity tools, libraries, or open-source infrastructure.",
      tags: ["DevTools", "OpenSource", "Infra"],
    },
  ];

  if (proposal.tracksAndGoals?.trim()) {
    const rawLines = proposal.tracksAndGoals
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    if (rawLines.length > 0) {
      tracks = rawLines.slice(0, 6).map((line, idx) => {
        const cleanTitle = line.replace(/^[0-9.-]+\s*/, "").trim();
        const trackId =
          cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
          `track-${idx + 1}`;
        const words = cleanTitle.split(" ").filter((w) => w.length > 2);
        const tags = Array.from(new Set([words[0] || "Innovation", words[1] || "Tech", proposal.orgName.split(" ")[0]]));
        return {
          id: trackId,
          title: cleanTitle.length > 50 ? cleanTitle.slice(0, 50) + "..." : cleanTitle,
          prize: proposal.estimatedPrizePool
            ? `Top Prize · ${proposal.estimatedPrizePool}`
            : "Cash Grant + Cloud Credits",
          description: `Build innovative, production-grade solutions for ${cleanTitle}.`,
          tags,
        };
      });
    }
  }

  return tracks;
}

export function parseAgendaToSchedule(proposal: {
  agenda?: string;
  hackathonTitle: string;
  eventFormat?: string;
  targetDates?: string;
}) {
  const formatStr = (proposal.eventFormat || "").toLowerCase();
  const datesStr = (proposal.targetDates || "").toLowerCase();

  const is3Hour = formatStr.includes("3-hour") || formatStr === "3-hours" || datesStr.includes("3 hour") || datesStr.includes("3hr") || datesStr.includes("3-hr");
  const is5Hour = formatStr.includes("5-hour") || formatStr === "5-hours" || datesStr.includes("5 hour") || datesStr.includes("5hr") || datesStr.includes("5-hr");
  const isSingleDay = formatStr.includes("single-day") || formatStr.includes("1-day") || datesStr.includes("single day") || datesStr.includes("1 day") || datesStr.includes("8 hour") || datesStr.includes("12 hour");

  if (proposal.agenda?.trim()) {
    const rawAgendaLines = proposal.agenda
      .split(/\n+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 2);

    if (rawAgendaLines.length > 0) {
      return rawAgendaLines.slice(0, 8).map((line: string, idx: number) => {
        let time = `Milestone ${idx + 1}`;
        let title = line;

        if (line.includes(" : ")) {
          const split = line.split(" : ");
          time = split[0].trim().replace(/\s*-\s*/, " · ");
          title = split.slice(1).join(" : ").trim();
        } else if (line.includes(" - ") && !line.match(/^[a-zA-Z]+\s+\d+\s+-\s+\d+/)) {
          const split = line.split(" - ");
          time = split[0].trim();
          title = split.slice(1).join(" - ").trim();
        } else {
          const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
          if (colonMatch) {
            time = colonMatch[1].trim().replace(/\s*-\s*/, " · ");
            title = colonMatch[2].trim();
          }
        }

        return {
          time: time || `Phase ${idx + 1}`,
          title: title || line,
          description: `Official event milestone for ${proposal.hackathonTitle}.`,
          status: (idx === 0 ? "active" : "upcoming") as "active" | "upcoming" | "completed",
        };
      });
    }
  }

  if (is3Hour) {
    return [
      { time: "00:00", title: "Theme Reveal & Timer Starts", description: "Prompt released, sprint clock begins.", status: "active" as const },
      { time: "01:30", title: "Midpoint Check-in", description: "Architecture huddle and mentor assistance.", status: "upcoming" as const },
      { time: "02:45", title: "15-Min Warning & Polish", description: "Verify GitHub links and live demos.", status: "upcoming" as const },
      { time: "03:00", title: "Submissions Lock & Demos", description: "Submissions lock, live judge evaluation.", status: "upcoming" as const },
    ];
  }

  if (is5Hour) {
    return [
      { time: "00:00", title: "Opening Kickoff & Challenge Reveal", description: "Timer starts, repo templates distributed.", status: "active" as const },
      { time: "02:30", title: "Mid-Sprint Check-in", description: "Mentor office hours & live feedback.", status: "upcoming" as const },
      { time: "04:30", title: "Final Polish & Link Drop", description: "Test live URLs & decks.", status: "upcoming" as const },
      { time: "05:00", title: "Code Freeze & Live Demos", description: "Final judging and leaderboard reveal.", status: "upcoming" as const },
    ];
  }

  if (isSingleDay) {
    return [
      { time: "09:00 UTC", title: "Morning Kickoff Broadcast", description: "Live stream opening & prompt reveal.", status: "active" as const },
      { time: "13:00 UTC", title: "Lunch & Architecture Review", description: "Midway checkpoint with mentors.", status: "upcoming" as const },
      { time: "17:00 UTC", title: "Final Submission Lock", description: "Submissions freeze for deliberation.", status: "upcoming" as const },
      { time: "18:30 UTC", title: "Lightning Demos & Winners", description: "Top projects present live.", status: "upcoming" as const },
    ];
  }

  return FLAGSHIP_HACKATHON.schedule;
}

export function buildHackathonFromProposal(proposal: HostHackathonProposal): HackathonData {
  let baseSlug = proposal.hackathonTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!baseSlug) baseSlug = `hackathon-${Date.now()}`;
  if (baseSlug === "shipathon-2026") baseSlug = `partner-${baseSlug}`;

  const slug = baseSlug;
  const hackathonId = `gh-${slug}`;

  const tracks = parseProposalTracks(proposal);
  const schedule = parseAgendaToSchedule(proposal);

  const now = new Date();
  let durationHours = 48;
  const formatStr = (proposal.eventFormat || "").toLowerCase();
  const datesStr = (proposal.targetDates || "").toLowerCase();

  const is3Hour = formatStr.includes("3-hour") || formatStr === "3-hours" || datesStr.includes("3 hour") || datesStr.includes("3hr") || datesStr.includes("3-hr");
  const is5Hour = formatStr.includes("5-hour") || formatStr === "5-hours" || datesStr.includes("5 hour") || datesStr.includes("5hr") || datesStr.includes("5-hr");
  const isSingleDay = formatStr.includes("single-day") || formatStr.includes("1-day") || datesStr.includes("single day") || datesStr.includes("1 day") || datesStr.includes("8 hour") || datesStr.includes("12 hour");
  const isMultiWeek = formatStr.includes("async-marathon") || formatStr.includes("month") || datesStr.includes("month") || datesStr.includes("4 week");

  if (is3Hour) {
    durationHours = 3;
  } else if (is5Hour) {
    durationHours = 5;
  } else if (isSingleDay) {
    durationHours = 12;
  } else if (isMultiWeek) {
    durationHours = 28 * 24;
  }

  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
  const deadlineBufferMinutes = durationHours <= 3 ? 15 : durationHours <= 5 ? 20 : durationHours <= 12 ? 45 : 240;
  const submissionDeadline = new Date(new Date(endDate).getTime() - deadlineBufferMinutes * 60 * 1000).toISOString();

  const hostEmail = proposal.contactEmail.trim().toLowerCase();
  const hostKey = `GH-HOST-${proposal.refNumber.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "ADMIN"}`;

  return {
    id: hackathonId,
    slug: slug,
    title: proposal.hackathonTitle,
    tagline: `Hosted by ${proposal.orgName}. Build, ship, and win cash grants & holographic credentials.`,
    description: `Welcome to ${proposal.hackathonTitle}, organized by ${proposal.orgName} on the official GoHackerz Arena. Form a squad, earn your 3D holographic Hacker Passport, and submit lightweight project links.`,
    hostEmail,
    hostKey,
    status: "ACTIVE",
    startDate,
    endDate,
    submissionDeadline,
    prizePool: proposal.estimatedPrizePool || "$10,000 Cash Grants",
    participantCount: 0,
    teamCount: 0,
    tracks,
    schedule,
    rules: FLAGSHIP_HACKATHON.rules,
    sponsors: [
      {
        name: proposal.orgName,
        tier: "Title",
        perk: "Title Host & Prize Grant",
        logoText: `⚡ ${proposal.orgName}`,
      },
    ],
    faqs: FLAGSHIP_HACKATHON.faqs,
  };
}

/**
 * Convert an approved host proposal into an active, provisioned Hackathon on GoHackerz!
 * Dispatches approval email to organizer with their live arena & admin studio links.
 */
export async function createHackathonFromProposal(proposalIdOrRef: string): Promise<{
  hackathon: HackathonData;
  proposal: HostHackathonProposal;
}> {
  const proposal = await updateHostProposalStatus(proposalIdOrRef, "APPROVED");
  if (!proposal) {
    throw new Error("Host proposal not found.");
  }

  const hackathon = buildHackathonFromProposal(proposal);
  const slug = hackathon.slug;

  // 3. Persist hackathon to disk & memory
  savePersistedCustomHackathon(hackathon);
  persistHackathonStatus(slug, "ACTIVE");

  // 4. Persist to DB if available
  if (isDbAvailable()) {
    try {
      await ensureTablesExist();
      await prisma.hackathon.upsert({
        where: { slug: hackathon.slug },
        update: {
          title: hackathon.title,
          tagline: hackathon.tagline,
          description: hackathon.description,
          status: "ACTIVE" as any,
          prizePool: hackathon.prizePool,
          tracks: hackathon.tracks as any,
          rules: hackathon.rules as any,
          sponsors: hackathon.sponsors as any,
          faqs: hackathon.faqs as any,
        },
        create: {
          id: hackathon.id,
          slug: hackathon.slug,
          title: hackathon.title,
          tagline: hackathon.tagline,
          description: hackathon.description,
          status: "ACTIVE" as any,
          startDate: new Date(hackathon.startDate),
          endDate: new Date(hackathon.endDate),
          submissionDeadline: new Date(hackathon.submissionDeadline),
          prizePool: hackathon.prizePool,
          tracks: hackathon.tracks as any,
          rules: hackathon.rules as any,
          sponsors: hackathon.sponsors as any,
          faqs: hackathon.faqs as any,
        },
      });
    } catch (e) {
      console.warn("[createHackathonFromProposal] DB write notice:", e);
    }
  }

  // 5. Send Approval & Launch email to organizer
  try {
    const approvalEmail = hostProposalApprovedEmail({
      refNumber: proposal.refNumber,
      orgName: proposal.orgName,
      contactName: proposal.contactName,
      contactEmail: proposal.contactEmail,
      hackathonTitle: hackathon.title,
      hackathonSlug: hackathon.slug,
      hostKey: hackathon.hostKey,
    });
    const result = await sendEmail(approvalEmail);
    console.info(
      `[createHackathonFromProposal] Approval email sent to ${proposal.contactEmail}, delivered: ${result.delivered}`
    );
  } catch (mailErr) {
    console.warn("[createHackathonFromProposal] Approval email warning:", mailErr);
  }

  return { hackathon, proposal };
}
