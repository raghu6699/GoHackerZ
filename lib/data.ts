// ─────────────────────────────────────────────────────────────
// GOHACKERZ · Data Types & Core Topic Metadata
// ─────────────────────────────────────────────────────────────

export type AvatarColor =
  | "purple"
  | "pink"
  | "sky"
  | "peach"
  | "lime"
  | "emerald"
  | "rose"
  | "amber"
  | "indigo"
  | "ink";

export interface Author {
  username: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  avatarColor: AvatarColor;
  avatarUrl?: string | null;
  bio: string;
  followers: number;
  articleCount: number;
}

export interface Topic {
  slug: string;
  name: string;
  emoji: string;
  color: AvatarColor;
  description: string;
}

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "img"; src: string; alt: string; caption?: string }
  | { type: "footnotes"; items: { id: string; text: string }[] };

export interface Article {
  slug: string;
  title: string;
  dek: string;
  authorUsername: string;
  topicSlug: string;
  readingTime: number;
  reactions: number;
  comments: number;
  bookmarks: number;
  publishedAt: string; // ISO
  tags: string[];
  featured?: boolean;
  content: Block[];
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  scheduledAt?: string | null;
}

// ── Production Topic Categories ────────────────────────────────
export const topics: Topic[] = [
  {
    slug: "ai",
    name: "AI & Machine Learning",
    emoji: "🧠",
    color: "purple",
    description: "LLMs, GPU infrastructure, inference latency, agent patterns, and production ML systems.",
  },
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    emoji: "🤖",
    color: "purple",
    description: "Shipping models to production without losing your mind (or your budget).",
  },
  {
    slug: "systems",
    name: "Systems & Architecture",
    emoji: "⚡",
    color: "pink",
    description: "Distributed systems, performance tuning, consensus, microservices, and infrastructure engineering.",
  },
  {
    slug: "architecture",
    name: "Architecture",
    emoji: "🏗️",
    color: "pink",
    description: "Monoliths, services, and the tradeoffs nobody warns you about.",
  },
  {
    slug: "databases",
    name: "Databases & Storage",
    emoji: "🗄️",
    color: "sky",
    description: "Postgres internals, query planning, indexing strategies, distributed data stores, and caching.",
  },
  {
    slug: "web",
    name: "Web & Frontend",
    emoji: "🌐",
    color: "peach",
    description: "Next.js, React, WebAssembly, browser engines, hydration strategies, and UI architecture.",
  },
  {
    slug: "rust",
    name: "Rust",
    emoji: "🦀",
    color: "peach",
    description: "Ownership, safety, and going fast without footguns.",
  },
  {
    slug: "culture",
    name: "Culture",
    emoji: "✨",
    color: "peach",
    description: "Craft, teams, and what it means to build software worth reading about.",
  },
  {
    slug: "devops",
    name: "DevOps & Cloud",
    emoji: "🛠️",
    color: "lime",
    description: "Kubernetes, CI/CD pipelines, Docker, terraform, site reliability, and cloud architecture.",
  },
  {
    slug: "security",
    name: "Security & Crypto",
    emoji: "🔒",
    color: "ink",
    description: "Zero trust, cryptography, appsec, vulnerability research, and security engineering.",
  },
];

// No mock authors or articles — platform starts 100% clean for real users
export const authors: Author[] = [];
export const articles: Article[] = [];

// ── Formatting Helpers ───────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(iso);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const topicChipClass: any = Object.assign(
  function (slug: string): string {
    const map: Record<string, string> = {
      ai: "bg-purple text-white",
      "ai-engineering": "bg-purple text-white",
      systems: "bg-pink text-[#1A1440]",
      architecture: "bg-pink text-[#1A1440]",
      databases: "bg-sky text-[#1A1440]",
      web: "bg-peach text-[#1A1440]",
      rust: "bg-peach text-[#1A1440]",
      culture: "bg-peach text-[#1A1440]",
      devops: "bg-lime text-[#1A1440]",
      security: "bg-ink text-white",
      purple: "bg-purple text-white",
      pink: "bg-pink text-[#1A1440]",
      sky: "bg-sky text-[#1A1440]",
      peach: "bg-peach text-[#1A1440]",
      lime: "bg-lime text-[#1A1440]",
      ink: "bg-ink text-white",
    };
    return map[slug] ?? "bg-card text-ink";
  },
  {
    ai: "bg-purple text-white",
    "ai-engineering": "bg-purple text-white",
    systems: "bg-pink text-[#1A1440]",
    architecture: "bg-pink text-[#1A1440]",
    databases: "bg-sky text-[#1A1440]",
    web: "bg-peach text-[#1A1440]",
    rust: "bg-peach text-[#1A1440]",
    culture: "bg-peach text-[#1A1440]",
    devops: "bg-lime text-[#1A1440]",
    security: "bg-ink text-white",
    purple: "bg-purple text-white",
    pink: "bg-pink text-[#1A1440]",
    sky: "bg-sky text-[#1A1440]",
    peach: "bg-peach text-[#1A1440]",
    lime: "bg-lime text-[#1A1440]",
    ink: "bg-ink text-white",
  }
);

// ── Query Helpers (Pure Empty State Returns) ─────────────────
export function getFeatured(): Article | undefined {
  return undefined;
}

export function getLatest(_limit?: number): Article[] {
  return [];
}

export function getTrending(_limit = 4): Article[] {
  return [];
}

export function getArticle(_slug: string): Article | undefined {
  return undefined;
}

export function getArticlesByTopic(_slug: string): Article[] {
  return [];
}

export function getArticlesByAuthor(_username: string): Article[] {
  return [];
}

export function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function getAuthor(_username: string): Author | undefined {
  return undefined;
}
