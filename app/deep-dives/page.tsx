import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getLatest, preloadCardData } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Deep Dives",
  description: "Long-form essays on systems, architecture, distributed work, and engineering craft.",
};

export default async function DeepDivesPage() {
  const allLatest = await getLatest(50);
  const posts = allLatest.filter((article) => article.readingTime >= 5);
  const cardData = posts.length > 0 ? await preloadCardData(posts) : { authors: new Map(), topics: new Map() };

  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mb-8 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Deep dives</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Long-form engineering thinking.</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">Essays with 5+ minutes reading time that reward close reading.</p>
      </header>

      {posts.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {posts.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              author={cardData.authors.get(article.authorUsername)}
              topic={cardData.topics.get(article.topicSlug)}
            />
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border-2 border-ink bg-card p-8 sm:p-12 text-center shadow-pop-lg max-w-2xl mx-auto my-8">
          <div className="text-[56px] mb-4">📖</div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No Long-Form Deep Dives Yet</h2>
          <p className="text-muted text-base mb-6">
            Articles with a calculated reading time of 5+ minutes appear here automatically, keeping this section true to its long-form promise.
          </p>
          <a href="/write" className="btn btn-purple font-bold">
            Write a Deep Dive Essay ✦
          </a>
        </div>
      )}
    </div>
  );
}
