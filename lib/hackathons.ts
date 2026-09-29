/**
 * GoHackerz Hackathons Domain Layer
 * Handles events, registrations, team formations, tickets, and lightweight link submissions.
 */

export type HackathonTrack = {
  id: string;
  title: string;
  prize: string;
  description: string;
  tags: string[];
};

export type HackathonScheduleItem = {
  time: string;
  title: string;
  description: string;
  status: "completed" | "active" | "upcoming";
};

export type HackathonSponsor = {
  name: string;
  tier: "Title" | "Platinum" | "Gold";
  perk: string;
  logoText: string;
};

export type HackathonTheme = "lime" | "neon" | "matrix" | "gold";

export type HackathonData = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  coverImage?: string;
  status: "UPCOMING" | "ACTIVE" | "JUDGING" | "COMPLETED";
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  prizePool: string;
  participantCount: number;
  teamCount: number;
  tracks: HackathonTrack[];
  schedule: HackathonScheduleItem[];
  rules: string[];
  sponsors: HackathonSponsor[];
  faqs: { q: string; a: string }[];
};

export type HackathonParticipant = {
  id: string;
  hackathonId: string;
  ticketNumber: string;
  name: string;
  email: string;
  roleTitle: string; // e.g. "Fullstack & AI", "Systems Architect"
  bio?: string;
  discordHandle?: string;
  twitterHandle?: string;
  avatarUrl?: string;
  themeStyle: HackathonTheme;
  isCaptain: boolean;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  teammates?: { name: string; roleTitle: string; avatarUrl?: string }[];
  submission?: HackathonSubmission;
  createdAt: string;
};

export type HackathonTeam = {
  id: string;
  hackathonId: string;
  name: string;
  tagline?: string;
  inviteCode: string;
  captainId: string;
  members: HackathonParticipant[];
  createdAt: string;
};

export type HackathonSubmission = {
  id: string;
  hackathonId: string;
  ticketNumber?: string;
  teamName?: string;
  trackId: string;
  title: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  pitchDeckUrl?: string; // PPT, Gamma, Google Slides, Pitch
  videoUrl?: string; // YouTube, Loom
  gammaUrl?: string; // Gamma presentation URL
  techStack: string[];
  authorName: string;
  createdAt: string;
  upvotes?: number;
};

// Flagship Inaugural Hackathon
export const FLAGSHIP_HACKATHON: HackathonData = {
  id: "gh-shipathon-2026",
  slug: "shipathon-2026",
  title: "GoHackerz Global Shipathon 2026",
  tagline: "Build with Edge & AI. Ship in 48 hours. Win Cash Grants & Prestige.",
  description:
    "The premier hackathon for the builders who ship. Assemble a team or ride solo, build bleeding-edge apps using AI Agents, Edge Infrastructure, and High-Performance Web systems. Every participant earns their official Holographic Hacker Passport.",
  status: "ACTIVE",
  startDate: "2026-10-10T00:00:00Z",
  endDate: "2026-10-12T23:59:59Z",
  submissionDeadline: "2026-10-12T20:00:00Z",
  prizePool: "Cash Grants + Trophy + Cloud Credits",
  participantCount: 342,
  teamCount: 94,
  tracks: [
    {
      id: "ai-agents",
      title: "Autonomous AI Agents & Workflows",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Build autonomous multi-agent systems, code copilots, memory-augmented LLM chains, or proactive background helpers.",
      tags: ["AI", "Agents", "LangChain", "Vector DBs", "OpenAI/Claude"],
    },
    {
      id: "edge-systems",
      title: "Edge Architecture & High-Performance Web",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Ultra-low latency web apps, distributed real-time systems, CRDTs, edge functions, and local-first software.",
      tags: ["Edge", "Wasm", "Distributed", "Realtime", "Next.js"],
    },
    {
      id: "devex-tools",
      title: "Developer Tools & Open Source Infrastructure",
      prize: "Cash Grant + Cloud Credits",
      description:
        "Tools that save engineers hours every week. CLI utilities, testing frameworks, observability pipelines, and code visualizers.",
      tags: ["DevEx", "CLI", "Rust/Go", "Prisma", "Observability"],
    },
  ],
  schedule: [
    {
      time: "Day 1 · 09:00 UTC",
      title: "Opening Keynote & Hacking Kickoff",
      description: "Live broadcast, theme reveal, and official timer starts.",
      status: "active",
    },
    {
      time: "Day 1 · 18:00 UTC",
      title: "Mentor Office Hours & Team Pitch Check-in",
      description: "Get feedback on architecture from GoHackerz engineering leads.",
      status: "upcoming",
    },
    {
      time: "Day 2 · 14:00 UTC",
      title: "Soft Submission & Deck Polish",
      description: "Test your live demo links, upload Gamma pitch decks and YouTube walkthroughs.",
      status: "upcoming",
    },
    {
      time: "Day 2 · 20:00 UTC",
      title: "Final Submission Deadline",
      description: "Hacking stops. Submission links lock for judge deliberation.",
      status: "upcoming",
    },
    {
      time: "Day 3 · 18:00 UTC",
      title: "Grand Finale, Demos & Winners Ceremony",
      description: "Top 5 teams demo live, prize distribution, and profile trophy badges awarded.",
      status: "upcoming",
    },
  ],
  rules: [
    "All code must be fresh and written during the hackathon window. Open-source libraries and APIs are permitted.",
    "Teams can consist of 1 to 4 hackers.",
    "Submissions must include a GitHub repository, working demo or video, and pitch deck (Gamma / PPT / Google Slides).",
    "Respect the hacker code of conduct: share knowledge, respect fellow builders, and have fun!",
  ],
  sponsors: [
    { name: "Supabase", tier: "Title", perk: "Free Pro tier + Vector DB credits", logoText: "⚡ Supabase" },
    { name: "Vercel", tier: "Platinum", perk: "Enterprise edge deployment credits", logoText: "▲ Vercel" },
    { name: "Prisma", tier: "Platinum", perk: "Prisma Accelerate & Pulse grants", logoText: "◬ Prisma" },
    { name: "Gamma", tier: "Gold", perk: "AI presentation generation plus credits", logoText: "✦ Gamma" },
  ],
  faqs: [
    {
      q: "Can I participate solo or do I need a team?",
      a: "Both! You can hack completely solo or form a team of up to 4 members. You can generate a team invite code to invite friends at any time.",
    },
    {
      q: "How does the animated Hacker Passport work?",
      a: "Once you register, you receive an interactive 3D holographic Hacker Passport with your unique Ticket ID and scannable QR code. You can download it as an image, share it to Twitter/X, and show off your team credentials.",
    },
    {
      q: "What do I need to submit when finished?",
      a: "Submissions are 100% lightweight link-based! You just need: your GitHub repo, your Live Demo link, your Pitch Deck (Gamma or PPT/Google Slides link), and an optional YouTube/Loom video demo.",
    },
    {
      q: "Is there any registration fee?",
      a: "Zero fee. GoHackerz hackathons are 100% free and open to all passionate developers, students, and engineers worldwide.",
    },
  ],
};

// Seed sample participants for demonstration and ticket exploration
const SEED_PARTICIPANTS: HackathonParticipant[] = [
  {
    id: "part-01",
    hackathonId: "gh-shipathon-2026",
    ticketNumber: "GH-2026-X89B",
    name: "Alex Vance",
    email: "alex@gohackerz.dev",
    roleTitle: "Lead Systems Architect",
    bio: "Obsessed with CRDTs, Rust edge workers, and distributed state machines.",
    discordHandle: "alexvance#404",
    twitterHandle: "@alexv_dev",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    themeStyle: "lime",
    isCaptain: true,
    teamId: "team-void",
    teamName: "Team Void Runners",
    teamCode: "VOID-42",
    teammates: [
      { name: "Alex Vance", roleTitle: "Systems Architect" },
      { name: "Sarah Chen", roleTitle: "AI & Vector Search" },
      { name: "Dev Patel", roleTitle: "Fullstack / Next.js" },
    ],
    submission: {
      id: "sub-01",
      hackathonId: "gh-shipathon-2026",
      ticketNumber: "GH-2026-X89B",
      teamName: "Team Void Runners",
      trackId: "ai-agents",
      title: "PulseFlow AI: Autonomous PR Review Swarm",
      tagline: "Multi-agent swarm that stress-tests, reproduces race conditions, and drafts PR fixes automatically.",
      description:
        "PulseFlow connects to your GitHub repository and spins up a swarm of specialized agent personas (Security Auditor, Performance Benchmark, and Spec Verifier) to review PRs in seconds.",
      repoUrl: "https://github.com/gohackerz/pulseflow-ai",
      demoUrl: "https://pulseflow.gohackerz.dev",
      pitchDeckUrl: "https://gamma.app/docs/pulseflow-ai-pitch",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      gammaUrl: "https://gamma.app/docs/pulseflow-ai-pitch",
      techStack: ["Next.js 15", "TypeScript", "LangChain", "Supabase Vector", "Prisma"],
      authorName: "Alex Vance",
      createdAt: "2026-10-11T16:20:00Z",
      upvotes: 48,
    },
    createdAt: "2026-09-28T12:00:00Z",
  },
  {
    id: "part-02",
    hackathonId: "gh-shipathon-2026",
    ticketNumber: "GH-2026-N309",
    name: "Elena Rostova",
    email: "elena@matrix.io",
    roleTitle: "Fullstack AI Engineer",
    bio: "Building local-first speech synthesis and browser LLM inference engines.",
    discordHandle: "elena_r#892",
    twitterHandle: "@elena_builds",
    themeStyle: "neon",
    isCaptain: false,
    teamName: "Neural Forge",
    teamCode: "FORGE-99",
    teammates: [
      { name: "Elena Rostova", roleTitle: "AI Engineer" },
      { name: "Marcus Brody", roleTitle: "UI/UX Wizard" },
    ],
    submission: {
      id: "sub-02",
      hackathonId: "gh-shipathon-2026",
      ticketNumber: "GH-2026-N309",
      teamName: "Neural Forge",
      trackId: "edge-systems",
      title: "EdgeWhisper: Zero-Server On-Device Voice Intelligence",
      tagline: "Ultra-fast voice-to-structured-data engine running 100% inside WebAssembly on Edge.",
      description:
        "Transforms long voice memos into actionable Linear tickets and architectural docs with zero cloud latency and total privacy.",
      repoUrl: "https://github.com/gohackerz/edgewhisper",
      demoUrl: "https://edgewhisper.dev",
      pitchDeckUrl: "https://gamma.app/docs/edgewhisper-deck",
      videoUrl: "https://youtube.com",
      gammaUrl: "https://gamma.app/docs/edgewhisper-deck",
      techStack: ["WebAssembly", "Wasm-pack", "Next.js", "Tailwind CSS"],
      authorName: "Elena Rostova",
      createdAt: "2026-10-11T18:45:00Z",
      upvotes: 35,
    },
    createdAt: "2026-09-28T14:30:00Z",
  },
];

import {
  loadPersistedParticipants,
  persistParticipant,
  getPersistedParticipantByTicket,
  persistTeam,
  loadPersistedTeams,
  getPersistedTeamByCode,
  addMemberToTeam,
  createNewTeam,
  leaveCurrentTeam,
} from "./participant-store";

// Persistent Global store (singleton across all Next.js serverless/SSR invocations and hot-reloads)
interface GlobalHackathonStore {
  participants: Map<string, HackathonParticipant>;
  teams: Map<string, HackathonTeam>;
  submissions: Map<string, HackathonSubmission>;
}

const globalForHackathons = globalThis as unknown as {
  hackathonStore?: GlobalHackathonStore;
};

if (!globalForHackathons.hackathonStore) {
  const persistedParticipants = loadPersistedParticipants();
  const allInitial = [...SEED_PARTICIPANTS];
  for (const p of persistedParticipants) {
    const existingIdx = allInitial.findIndex(
      (s) => s.ticketNumber.toUpperCase() === p.ticketNumber.toUpperCase()
    );
    if (existingIdx >= 0) {
      allInitial[existingIdx] = p;
    } else {
      allInitial.push(p);
    }
  }

  globalForHackathons.hackathonStore = {
    participants: new Map<string, HackathonParticipant>(
      allInitial.map((p) => [p.ticketNumber, p])
    ),
    teams: new Map<string, HackathonTeam>(
      loadPersistedTeams().map((t) => [t.inviteCode, t])
    ),
    submissions: new Map<string, HackathonSubmission>(
      allInitial
        .filter((p) => p.submission)
        .map((p) => [p.submission!.id, p.submission!])
    ),
  };
}

const memoryStore = globalForHackathons.hackathonStore;

// Generate clean unique ticket ID (e.g. GH-2026-A82F)
export function generateTicketNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GH-2026-${code}`;
}

// Generate team invite code (e.g. HACK-7X9B)
export function generateTeamCode(teamName: string): string {
  const prefix = teamName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "TEAM";
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

export async function getHackathonBySlug(slug: string): Promise<HackathonData | null> {
  if (slug === FLAGSHIP_HACKATHON.slug || slug === "active" || slug === "current") {
    return {
      ...FLAGSHIP_HACKATHON,
      participantCount: FLAGSHIP_HACKATHON.participantCount + memoryStore.participants.size - SEED_PARTICIPANTS.length,
      teamCount: FLAGSHIP_HACKATHON.teamCount + memoryStore.teams.size,
    };
  }
  return null;
}

export async function getAllHackathons(): Promise<HackathonData[]> {
  const flagship = await getHackathonBySlug(FLAGSHIP_HACKATHON.slug);
  return flagship ? [flagship] : [FLAGSHIP_HACKATHON];
}

export async function getParticipantByTicket(ticketNumber: string): Promise<HackathonParticipant | null> {
  if (!ticketNumber) return null;
  const clean = ticketNumber.trim().toUpperCase();

  const direct = memoryStore.participants.get(clean);
  if (direct) return direct;

  // Search case-insensitive in memory
  for (const [key, val] of memoryStore.participants.entries()) {
    if (key.toUpperCase() === clean) return val;
  }

  // Check persistent disk storage (ensures cross-device / cold-start sync)
  const persisted = getPersistedParticipantByTicket(clean);
  if (persisted) {
    memoryStore.participants.set(clean, persisted);
    return persisted;
  }

  return null;
}

export async function getParticipantByEmail(
  hackathonId: string,
  email: string
): Promise<HackathonParticipant | null> {
  const target = email.trim().toLowerCase();
  for (const p of memoryStore.participants.values()) {
    if (p.hackathonId === hackathonId && p.email.toLowerCase() === target) {
      return p;
    }
  }

  // Check disk
  const persistedList = loadPersistedParticipants();
  const found = persistedList.find(
    (p) => p.hackathonId === hackathonId && p.email.toLowerCase() === target
  );
  if (found) {
    memoryStore.participants.set(found.ticketNumber, found);
    return found;
  }

  return null;
}

export async function registerHacker(params: {
  hackathonId: string;
  name: string;
  email: string;
  roleTitle: string;
  bio?: string;
  discordHandle?: string;
  twitterHandle?: string;
  avatarUrl?: string;
  themeStyle?: HackathonTheme;
  teamOption: "solo" | "create" | "join";
  teamName?: string;
  teamInviteCode?: string;
}): Promise<HackathonParticipant> {
  const existing = await getParticipantByEmail(params.hackathonId, params.email);
  if (existing) {
    return existing;
  }

  const ticketNumber = generateTicketNumber();

  let participant: HackathonParticipant = {
    id: `part-${Date.now()}`,
    hackathonId: params.hackathonId,
    ticketNumber,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    roleTitle: params.roleTitle.trim() || "Fullstack Hacker",
    bio: params.bio?.trim(),
    discordHandle: params.discordHandle?.trim(),
    twitterHandle: params.twitterHandle?.trim(),
    avatarUrl: params.avatarUrl,
    themeStyle: params.themeStyle || "lime",
    isCaptain: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Initial participant save
  persistParticipant(participant);
  memoryStore.participants.set(ticketNumber, participant);

  // 2. Handle team formation
  if (params.teamOption === "create" && params.teamName?.trim()) {
    const teamRes = createNewTeam({
      teamName: params.teamName.trim(),
      creatorTicket: ticketNumber,
      hackathonId: params.hackathonId,
    });
    if (teamRes.success && teamRes.team) {
      memoryStore.teams.set(teamRes.team.inviteCode, teamRes.team);
      const updated = getPersistedParticipantByTicket(ticketNumber);
      if (updated) {
        participant = updated;
        memoryStore.participants.set(ticketNumber, updated);
      }
    }
  } else if (params.teamOption === "join" && params.teamInviteCode?.trim()) {
    const code = params.teamInviteCode.trim().toUpperCase();
    const joinRes = addMemberToTeam({
      teamCode: code,
      participantTicket: ticketNumber,
    });
    if (joinRes.success && joinRes.team) {
      memoryStore.teams.set(joinRes.team.inviteCode, joinRes.team);
      const updated = getPersistedParticipantByTicket(ticketNumber);
      if (updated) {
        participant = updated;
        memoryStore.participants.set(ticketNumber, updated);
      }
    }
  }

  return participant;
}

export async function submitProject(params: {
  hackathonId: string;
  ticketNumber: string;
  trackId: string;
  title: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  pitchDeckUrl?: string;
  videoUrl?: string;
  gammaUrl?: string;
  techStack: string[];
}): Promise<HackathonSubmission> {
  const participant = await getParticipantByTicket(params.ticketNumber);
  const subId = `sub-${Date.now()}`;

  const submission: HackathonSubmission = {
    id: subId,
    hackathonId: params.hackathonId,
    ticketNumber: params.ticketNumber,
    teamName: participant?.teamName,
    trackId: params.trackId,
    title: params.title.trim(),
    tagline: params.tagline.trim(),
    description: params.description.trim(),
    repoUrl: params.repoUrl.trim(),
    demoUrl: params.demoUrl?.trim(),
    pitchDeckUrl: params.pitchDeckUrl?.trim(),
    videoUrl: params.videoUrl?.trim(),
    gammaUrl: params.gammaUrl?.trim(),
    techStack: params.techStack.length > 0 ? params.techStack : ["Next.js", "TypeScript"],
    authorName: participant?.name || "Anonymous Builder",
    createdAt: new Date().toISOString(),
    upvotes: 1,
  };

  memoryStore.submissions.set(subId, submission);

  if (participant) {
    participant.submission = submission;
    memoryStore.participants.set(participant.ticketNumber, participant);
    persistParticipant(participant);
  }

  return submission;
}

export async function getAllSubmissions(hackathonId?: string): Promise<HackathonSubmission[]> {
  const list = Array.from(memoryStore.submissions.values());
  if (hackathonId) {
    return list.filter((s) => s.hackathonId === hackathonId);
  }
  return list;
}
