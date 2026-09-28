import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles, searchAuthors, searchTopics, preloadCardData } from "@/lib/queries";
import { SearchResultsView } from "@/components/SearchResultsView";
import type { Author, Topic } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search — GoHackerz",
  description: "Search essays, technical topics, and engineering writers across GoHackerz.",
};

const SUGGESTED_SEARCHES = [
  { label: "Machine Learning", query: "machine" },
  { label: "AI", query: "ai" },
  { label: "Systems", query: "systems" },
  { label: "Databases", query: "databases" },
  { label: "Rust", query: "rust" },
  { label: "DevOps", query: "devops" },
  { label: "Architecture", query: "architecture" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const [articles, authors, topics] = q
    ? await Promise.all([searchArticles(q), searchAuthors(q), searchTopics(q)])
    : [[], [], []];

  const cardData = await preloadCardData(q ? articles : []);
  const cardAuthors: Record<string, Author> = Object.fromEntries(cardData.authors);
  const cardTopics: Record<string, Topic> = Object.fromEntries(cardData.topics);

  return (
    <div className="wrap max-w-[960px] py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-[34px] sm:text-[40px] font-bold mb-3">Search</h1>
        <p className="text-muted text-base">
          Find topics, in-depth essays, and engineering writers across GoHackerz.
        </p>
      </header>

      {/* ── Search Form ── */}
      <form action="/search" className="flex gap-2.5 mb-4">
        <div className="relative flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search essays, topics, writers… (e.g. machine, rust, postgres)"
            className="w-full border-2 border-ink rounded-xl px-4 py-3 text-[15px] shadow-pop-sm outline-none bg-card text-ink focus:border-purple transition-all"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-purple shrink-0">
          Search →
        </button>
      </form>

      {/* ── Suggested Searches ── */}
      <div className="flex items-center gap-2 mb-10 flex-wrap">
        <span className="font-mono text-xs text-subtle font-bold uppercase tracking-wider">
          Popular:
        </span>
        {SUGGESTED_SEARCHES.map((item) => (
          <Link
            key={item.label}
            href={`/search?q=${encodeURIComponent(item.query)}`}
            className={`chip text-xs hover:border-purple transition-all ${
              q.toLowerCase() === item.query.toLowerCase()
                ? "bg-purple text-white shadow-pop-sm"
                : "bg-card text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* ── Search Results or Initial State ── */}
      {q ? (
        <SearchResultsView
          query={q}
          articles={articles}
          authors={authors}
          topics={topics}
          cardAuthors={cardAuthors}
          cardTopics={cardTopics}
        />
      ) : (
        <div className="rounded-3xl border-2 border-ink bg-card p-8 sm:p-12 text-center shadow-pop max-w-xl mx-auto my-6">
          <div className="text-4xl mb-3">💡</div>
          <h2 className="text-xl font-bold mb-2">Search across GoHackerz</h2>
          <p className="text-muted text-sm mb-6">
            Type a keyword above to find engineering topics like AI, databases, systems architecture, or individual writers and essays.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/topics" className="btn btn-purple">
              Browse Topics Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}