import type { Metadata } from "next";
import Link from "next/link";
import { getLatest, getAllTopics, preloadCardData } from "@/lib/queries";
import { ArticlesExplorer } from "@/components/ArticlesExplorer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Read",
  description: "Browse the latest practical essays from GoHackerz.",
};

export default async function ReadPage() {
  const [posts, allTopics] = await Promise.all([
    getLatest(50),
    getAllTopics(),
  ]);
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

      <ArticlesExplorer
        articles={posts}
        authors={Object.fromEntries(cardData.authors)}
        topics={Object.fromEntries(cardData.topics)}
        showTopicFilter={true}
        allTopicsList={allTopics}
        searchPlaceholder="Search feed essays by keyword, topic, or author…"
        emptyMessage="No essays found matching your filter in the feed."
      />

      <div className="mt-12 text-center">
        <Link href="/" className="btn btn-purple">Back to home</Link>
      </div>
    </div>
  );
}

