import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getLatest, preloadCardData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Read",
  description: "Browse the latest practical essays from GoHackerz.",
};

export default async function ReadPage() {
  const posts = await getLatest(30);
  const cardData = await preloadCardData(posts);

  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mb-8 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Read</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Fresh essays from the engineering frontier.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Postmortems, architecture decisions, database trade-offs, systems thinking, and AI work from people who ship in production.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            author={cardData.authors.get(article.authorUsername)}
            topic={cardData.topics.get(article.topicSlug)}
          />
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-purple">Back to home</Link>
      </div>
    </div>
  );
}
