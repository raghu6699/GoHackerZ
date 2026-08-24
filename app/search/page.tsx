import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import { searchArticles, searchAuthors, preloadCardData } from "@/lib/queries";

export const metadata: Metadata = { title: "Search — GoHackerz" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const [articles, authors] = q
    ? await Promise.all([searchArticles(q), searchAuthors(q)])
    : [[], []];
  const cardData = await preloadCardData(q ? articles : []);

  return (
    <div className="wrap max-w-[900px] py-12">
      <h1 className="text-[34px] font-bold mb-6">Search</h1>
      <form action="/search" className="flex gap-2.5 mb-10">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search essays, topics, writers…"
          className="flex-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] shadow-pop-sm outline-none bg-card text-ink"
        />
        <button type="submit" className="btn btn-purple">
          Search →
        </button>
      </form>

      {q && (
        <>
          <p className="font-mono text-[12px] text-subtle mb-6">
            {articles.length + authors.length} results for &ldquo;{q}&rdquo;
          </p>

          {authors.length > 0 && (
            <div className="flex gap-2.5 flex-wrap mb-8">
              {authors.map((a) => (
                <Link
                  key={a.username}
                  href={`/writer/${a.username}`}
                  className="card card-hover p-4 flex items-center gap-3"
                >
                  <Avatar initials={a.initials} color={a.avatarColor} size="sm" src={a.avatarUrl} />
                  <div>
                    <b className="text-[14px]">{a.name}</b>
                    <div className="font-mono text-[11px] text-subtle">
                      @{a.username} · {a.articleCount} essays
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {articles.length > 0 ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  author={cardData.authors.get(a.authorUsername)}
                  topic={cardData.topics.get(a.topicSlug)}
                />
              ))}
            </section>
          ) : authors.length === 0 ? (
            <div className="card p-10 text-center font-semibold">
              Nothing found. Try different keywords ✦
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}