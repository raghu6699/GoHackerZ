// ─────────────────────────────────────────────────────────────
// GOHACKERZ · mock data layer
// In the real app (see HLD/LLD) this is Postgres + Prisma.
// For the MVP it's typed in-memory data with the same shape.
// ─────────────────────────────────────────────────────────────

export type AvatarColor = "purple" | "pink" | "sky" | "peach" | "lime" | "ink";

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
}

// ── Authors ──────────────────────────────────────────────────
export const authors: Author[] = [
  {
    username: "maya",
    name: "Maya Krishnan",
    initials: "MK",
    role: "Staff Engineer",
    company: "Stripe",
    avatarColor: "peach",
    bio: "Distributed systems, latency budgets, and the art of doing less work. Previously infra at two startups you've never heard of.",
    followers: 18400,
    articleCount: 27,
  },
  {
    username: "jordan",
    name: "Jordan Tao",
    initials: "JT",
    role: "Principal Engineer",
    company: "Figma",
    avatarColor: "purple",
    bio: "Databases are a lifestyle. I will talk your ear off about query planners.",
    followers: 12100,
    articleCount: 19,
  },
  {
    username: "dan",
    name: "Dan Levin",
    initials: "DL",
    role: "Systems Engineer",
    company: "Oxide",
    avatarColor: "pink",
    bio: "Rust, kernels, and long walks through gdb. Ownership finally clicked and I can't shut up about it.",
    followers: 9800,
    articleCount: 14,
  },
  {
    username: "sofia",
    name: "Sofia Reyes",
    initials: "SR",
    role: "ML Systems",
    company: "Modal",
    avatarColor: "sky",
    bio: "Making GPUs go brrr responsibly. Occupancy > vibes.",
    followers: 15600,
    articleCount: 22,
  },
  {
    username: "amara",
    name: "Amara Okafor",
    initials: "AO",
    role: "Staff Architect",
    company: "Shopify",
    avatarColor: "lime",
    bio: "I delete more code than I write. Monoliths are underrated.",
    followers: 20300,
    articleCount: 31,
  },
  {
    username: "ravi",
    name: "Ravi Chandra",
    initials: "RC",
    role: "Backend Engineer",
    company: "Cloudflare",
    avatarColor: "purple",
    bio: "Rate limits, queues, and backpressure. If it's slow at the edge, ping me.",
    followers: 8700,
    articleCount: 11,
  },
  {
    username: "elena",
    name: "Elena Vasquez",
    initials: "EV",
    role: "AI Engineer",
    company: "Weaviate",
    avatarColor: "sky",
    bio: "Vector search, retrieval, and the occasional reality check about embeddings.",
    followers: 10400,
    articleCount: 16,
  },
  {
    username: "theo",
    name: "Theo Nakamura",
    initials: "TN",
    role: "Engineering Manager",
    company: "Linear",
    avatarColor: "peach",
    bio: "Boring technology enthusiast. Writes about culture, craft, and shipping.",
    followers: 13900,
    articleCount: 24,
  },
];

// ── Topics ───────────────────────────────────────────────────
export const topics: Topic[] = [
  { slug: "systems", name: "Systems", emoji: "🛠️", color: "sky", description: "Distributed systems, performance, and the guts of how software actually runs." },
  { slug: "rust", name: "Rust", emoji: "🦀", color: "peach", description: "Ownership, safety, and going fast without footguns." },
  { slug: "ai-engineering", name: "AI Engineering", emoji: "🤖", color: "purple", description: "Shipping models to production without losing your mind (or your budget)." },
  { slug: "databases", name: "Databases", emoji: "🗄️", color: "lime", description: "Query planners, indexes, and knowing when Postgres is enough." },
  { slug: "architecture", name: "Architecture", emoji: "🏗️", color: "pink", description: "Monoliths, services, and the tradeoffs nobody warns you about." },
  { slug: "culture", name: "Culture", emoji: "✨", color: "peach", description: "Craft, teams, and what it means to build software worth reading about." },
];

// ── Articles ─────────────────────────────────────────────────
export const articles: Article[] = [
  {
    slug: "three-assumptions-destroying-tail-latencies",
    title: "The three assumptions destroying your tail latencies",
    dek: "A brutally honest post-mortem on consensus, backpressure, and the day we realized our fastest path was the actual problem — how we cut p99 by 40× with zero new servers.",
    authorUsername: "maya",
    topicSlug: "systems",
    readingTime: 14,
    reactions: 3120,
    comments: 214,
    bookmarks: 1890,
    publishedAt: "2026-08-18T09:00:00Z",
    tags: ["latency", "postgres", "backpressure"],
    featured: true,
    content: [
      { type: "p", text: "For eighteen months our p50 looked great and our p99 looked like a crime scene. Same endpoint, same query, and yet one request in a hundred took forty times longer than the median. We blamed the network. We blamed the database. We were wrong on both counts." },
      { type: "h2", text: "Assumption #1: the fast path is the common path" },
      { type: "p", text: "We optimized relentlessly for the median request and treated the slow ones as noise. But tail latency is not noise — it is the experience of your most active users, because the more requests you make, the more likely you are to hit the tail at least once." },
      { type: "quote", text: "Your p99 is your power users' p50. Optimize accordingly." },
      { type: "p", text: "Once we started measuring per-user latency instead of per-request latency, the picture flipped. The people we cared about most were living in the tail." },
      { type: "h2", text: "Assumption #2: more concurrency is more throughput" },
      { type: "p", text: "We had no backpressure. Under load, our service happily accepted more work than it could finish, queues grew without bound, and every request paid the cost of the queue depth in front of it. Adding workers made it worse." },
      { type: "code", lang: "ts", code: "// before: unbounded, latency explodes under load\nasync function handle(req: Request) {\n  const rows = await db.query(SLOW_QUERY);\n  return render(rows);\n}\n\n// after: bounded concurrency + fast rejection\nconst gate = new Semaphore(64);\nasync function handle(req: Request) {\n  if (!gate.tryAcquire()) return tooBusy();\n  try {\n    const rows = await db.query(SLOW_QUERY);\n    return render(rows);\n  } finally {\n    gate.release();\n  }\n}" },
      { type: "p", text: "Rejecting a small fraction of requests quickly turned out to be dramatically better for everyone than accepting all of them slowly." },
      { type: "h2", text: "Assumption #3: the database is the bottleneck" },
      { type: "p", text: "It wasn't. The query was fast. The problem was that we opened a fresh connection per request, and under load the connection pool became a lottery. We added a properly sized pool and a statement cache, and the tail collapsed." },
      { type: "ul", items: [
        "Measure per-user latency, not just per-request.",
        "Add backpressure before you add workers.",
        "Pool connections and cache prepared statements.",
        "Reject fast instead of accepting slow.",
      ] },
      { type: "p", text: "Net result: p99 dropped 40×, p50 barely moved, and we didn't add a single machine. The fastest thing we did all year was decide to do less." },
    ],
  },
  {
    slug: "postgres-is-all-you-need",
    title: "Postgres is all you need (until it isn't)",
    dek: "4TB at 90k QPS for two years before reaching for anything exotic. Here's exactly where the walls are — and how to see them coming.",
    authorUsername: "jordan",
    topicSlug: "databases",
    readingTime: 9,
    reactions: 2740,
    comments: 168,
    bookmarks: 1610,
    publishedAt: "2026-08-17T14:00:00Z",
    tags: ["postgres", "scaling", "sql"],
    content: [
      { type: "p", text: "Every few months someone tells me Postgres won't scale. Then I show them the dashboard: four terabytes, ninety thousand queries per second, one primary and two replicas. It has been boring for two years, and boring is the highest compliment I can pay a database." },
      { type: "h2", text: "Where the walls actually are" },
      { type: "p", text: "You will not hit a scaling wall because Postgres is slow. You will hit it because of one of these, in roughly this order:" },
      { type: "ul", items: [
        "Connection count (fix: a pooler like PgBouncer).",
        "Write amplification from too many indexes.",
        "Long-running transactions blocking vacuum.",
        "A single hot row everyone updates.",
      ] },
      { type: "code", lang: "sql", code: "-- the query that saved us: find your bloat before it finds you\nSELECT relname, n_dead_tup, last_autovacuum\nFROM pg_stat_user_tables\nORDER BY n_dead_tup DESC\nLIMIT 10;" },
      { type: "p", text: "None of those require a rewrite. They require paying attention. Reach for something exotic when you have a specific reason — not because a conference talk scared you." },
    ],
  },
  {
    slug: "borrow-checker-finally-clicked",
    title: "The borrow checker finally clicked",
    dek: "Ownership isn't about memory — it's about who is allowed to change this, and when. Once that landed, everything else in Rust followed.",
    authorUsername: "dan",
    topicSlug: "rust",
    readingTime: 7,
    reactions: 2210,
    comments: 142,
    bookmarks: 1330,
    publishedAt: "2026-08-16T11:00:00Z",
    tags: ["rust", "ownership", "memory"],
    content: [
      { type: "p", text: "I fought the borrow checker for a month. Then a colleague said one sentence that reframed everything: 'It's not about memory. It's about permission to mutate.'" },
      { type: "h2", text: "One writer, many readers" },
      { type: "p", text: "The whole model collapses into a single rule: you can have many readers or one writer, never both at once. Every borrow error you've ever seen is the compiler enforcing that rule at compile time instead of letting you find out in production." },
      { type: "code", lang: "rust", code: "fn main() {\n    let mut v = vec![1, 2, 3];\n    let first = &v[0];   // shared borrow\n    v.push(4);           // needs a mutable borrow -> error!\n    println!(\"{first}\");\n}" },
      { type: "p", text: "The error isn't Rust being annoying. Pushing might reallocate the vector, leaving `first` dangling. In most languages that's a heisenbug. Here it's a red squiggle before you even run." },
      { type: "quote", text: "Ownership is just the answer to: who is allowed to change this, and when?" },
    ],
  },
  {
    slug: "what-makes-cuda-kernels-fast",
    title: "What actually makes CUDA kernels fast",
    dek: "Memory coalescing, occupancy, and the myth of 'just add more threads.' A mental model that finally stuck after years of guessing.",
    authorUsername: "sofia",
    topicSlug: "ai-engineering",
    readingTime: 12,
    reactions: 2530,
    comments: 176,
    bookmarks: 1720,
    publishedAt: "2026-08-15T16:00:00Z",
    tags: ["cuda", "gpu", "performance"],
    content: [
      { type: "p", text: "The first CUDA kernel I wrote was correct and embarrassingly slow. The GPU has thousands of cores, so I threw threads at it. That is not how any of this works." },
      { type: "h2", text: "It's a memory problem, not a compute problem" },
      { type: "p", text: "Modern GPUs are starving for data, not for arithmetic. The single biggest lever is memory coalescing: making sure adjacent threads read adjacent addresses so the hardware can serve them in one transaction instead of thirty-two." },
      { type: "code", lang: "cpp", code: "// coalesced: thread i reads element i -> one big load\nint i = blockIdx.x * blockDim.x + threadIdx.x;\nout[i] = in[i] * 2.0f;" },
      { type: "p", text: "Get that right and you're often already 10× faster than the naive version. Occupancy and shared memory are the next levers, but coalescing is the one that pays the rent." },
    ],
  },
  {
    slug: "deleted-our-microservices",
    title: "We deleted our microservices and nobody noticed",
    dek: "Forty services, three of which mattered. The story of collapsing a distributed monolith back into an actual monolith — and getting faster.",
    authorUsername: "amara",
    topicSlug: "architecture",
    readingTime: 16,
    reactions: 1920,
    comments: 203,
    bookmarks: 1440,
    publishedAt: "2026-08-14T10:00:00Z",
    tags: ["monolith", "microservices", "architecture"],
    content: [
      { type: "p", text: "We had forty microservices and eleven engineers. Do that math. Every feature crossed six service boundaries, four teams, and three on-call rotations. We were paying distributed-systems taxes to solve an organizational problem we didn't have." },
      { type: "h2", text: "The tell" },
      { type: "p", text: "Here's how you know your services are too small: a one-line change requires coordinating three deploys. Latency is dominated by network hops between services that always deploy together. Nobody can run the system on their laptop." },
      { type: "quote", text: "Microservices are an organizational tool wearing a technical costume." },
      { type: "p", text: "We merged the services that always changed together, kept the two that genuinely scaled independently, and deleted the rest. p95 dropped because we stopped serializing JSON across the datacenter. Nobody outside engineering noticed — which is exactly the point." },
    ],
  },
  {
    slug: "rate-limiting-in-a-trench-coat",
    title: "Rate limiting in a trench coat",
    dek: "Every fair-usage policy, quota, and abuse defense is the same token bucket wearing different clothes. Let's unmask it.",
    authorUsername: "ravi",
    topicSlug: "systems",
    readingTime: 11,
    reactions: 1640,
    comments: 121,
    bookmarks: 980,
    publishedAt: "2026-08-13T13:00:00Z",
    tags: ["rate-limiting", "redis", "edge"],
    content: [
      { type: "p", text: "Rate limiting sounds like a whole discipline until you notice that ninety percent of it is one algorithm — the token bucket — in different outfits." },
      { type: "code", lang: "ts", code: "// token bucket in ~10 lines\nfunction allow(state, now, rate, burst) {\n  const elapsed = now - state.last;\n  state.tokens = Math.min(burst, state.tokens + elapsed * rate);\n  state.last = now;\n  if (state.tokens < 1) return false;\n  state.tokens -= 1;\n  return true;\n}" },
      { type: "p", text: "Sliding windows, leaky buckets, GCRA — they're refinements on the same idea: track how fast you're spending a budget that refills over time. Learn the bucket, and the rest is costume changes." },
    ],
  },
  {
    slug: "vector-db-slower-than-grep",
    title: "Why your vector DB is slower than grep",
    dek: "For a surprising number of workloads, brute-force beats the fancy index. Here's the napkin math that tells you which camp you're in.",
    authorUsername: "elena",
    topicSlug: "ai-engineering",
    readingTime: 10,
    reactions: 1410,
    comments: 98,
    bookmarks: 870,
    publishedAt: "2026-08-12T15:00:00Z",
    tags: ["embeddings", "search", "ann"],
    content: [
      { type: "p", text: "A team came to me convinced they needed a distributed vector database. They had 40,000 documents. On a single machine, a brute-force cosine similarity over 40k vectors takes single-digit milliseconds. The index they were shopping for would have been slower and far more complex." },
      { type: "h2", text: "The napkin math" },
      { type: "p", text: "Approximate nearest neighbor indexes earn their keep at millions of vectors, not thousands. Below that, the index build time, memory overhead, and recall loss cost you more than they save. Do the brute-force math first." },
      { type: "quote", text: "The best index for 40,000 vectors is a for-loop." },
    ],
  },
  {
    slug: "love-letter-to-boring-technology",
    title: "A love letter to boring technology",
    dek: "The most exciting thing you can do to a production system is make it predictable. In praise of the unfashionable choice.",
    authorUsername: "theo",
    topicSlug: "culture",
    readingTime: 6,
    reactions: 1180,
    comments: 87,
    bookmarks: 760,
    publishedAt: "2026-08-11T09:00:00Z",
    tags: ["culture", "craft", "operations"],
    content: [
      { type: "p", text: "I have never once been paged at 3am because our tech stack was too boring. Every incident I can remember traces back to the exciting choice: the new datastore, the clever abstraction, the framework someone wanted on their resume." },
      { type: "h2", text: "Boring is a feature" },
      { type: "p", text: "Boring technology has a known failure surface. The bugs are already on Stack Overflow. The person who joins next month has already used it. You get to spend your limited innovation budget on the two or three things that are actually your product." },
      { type: "quote", text: "Choose boring technology so you can be interesting where it counts." },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────
export function getAuthor(username: string): Author | undefined {
  return authors.find((a) => a.username === username);
}

export function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByTopic(slug: string): Article[] {
  return articles.filter((a) => a.topicSlug === slug).sort(byNewest);
}

export function getArticlesByAuthor(username: string): Article[] {
  return articles.filter((a) => a.authorUsername === username).sort(byNewest);
}

export function getFeatured(): Article {
  return articles.find((a) => a.featured) ?? articles[0];
}

export function getLatest(limit?: number): Article[] {
  const sorted = [...articles].sort(byNewest);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getTrending(limit = 4): Article[] {
  return [...articles].sort((a, b) => b.reactions - a.reactions).slice(0, limit);
}

function byNewest(a: Article, b: Article): number {
  return +new Date(b.publishedAt) - +new Date(a.publishedAt);
}

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "3h ago" style stamps — feeds read faster; full date stays available. */
export function formatDateRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(iso);
}

// ── Topic color-coding ───────────────────────────────────────
// One accent hue per topic, used consistently across chips, borders and badges
// so every topic is visually identifiable site-wide.
export const topicChipClass: Record<AvatarColor, string> = {
  sky: "bg-sky text-[#1A1440]",
  pink: "bg-pink text-[#1A1440]",
  peach: "bg-peach text-[#1A1440]",
  lime: "bg-lime text-[#1A1440]",
  purple: "bg-purple text-white",
  ink: "bg-card text-ink",
};
