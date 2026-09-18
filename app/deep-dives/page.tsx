import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getLatest, preloadCardData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Deep Dives",
  description: "Long-form essays on systems, architecture, distributed work, and engineering craft.",
};

export default async function DeepDivesPage() {
  const posts = (await getLatest(30)).filter((article) => article.readingTime >= 8 || article.tags.includes("ai") || article.tags.includes("architecture"));
  const cardData = await preloadCardData(posts);

  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mb-8 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Deep dives</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Long-form engineering thinking.</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">Essays that take a little more time and reward close reading.</p>
      </header>

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
    </div>
  );
}
