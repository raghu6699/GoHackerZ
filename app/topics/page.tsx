import type { Metadata } from "next";
import { getAllTopics, countTopicArticles } from "@/lib/queries";
import { TopicsExplorer } from "@/components/TopicsExplorer";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse the categories we write about at GoHackerz.",
};

export default async function TopicsPage() {
  const topics = await getAllTopics();
  const counts = await Promise.all(
    topics.map(async (topic) => ({
      topic,
      count: await countTopicArticles(topic.slug),
    }))
  );

  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mb-10 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Topics</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">A map of the ideas we keep returning to.</h1>
        <p className="mt-3 text-muted text-lg max-w-2xl">
          Search and explore technical disciplines, architectures, and systems thinking.
        </p>
      </header>

      <TopicsExplorer topics={counts} />
    </div>
  );
}

