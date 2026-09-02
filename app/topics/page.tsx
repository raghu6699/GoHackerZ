import type { Metadata } from "next";
import Link from "next/link";
import { getAllTopics, countTopicArticles } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse the categories we write about at GoHackerz.",
};

export default async function TopicsPage() {
  const topics = await getAllTopics();
  const counts = await Promise.all(topics.map(async (topic) => ({
    topic,
    count: await countTopicArticles(topic.slug),
  })));

  return (
    <div className="wrap py-10 sm:py-14">
      <header className="mb-10 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Topics</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">A map of the ideas we keep returning to.</h1>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {counts.map(({ topic, count }) => (
          <Link
            key={topic.slug}
            href={`/topic/${topic.slug}`}
            className="card card-hover block p-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{topic.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold">{topic.name}</h2>
                <div className="font-mono text-xs uppercase text-subtle">#{topic.slug}</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{topic.description}</p>
            <div className="mt-5 inline-flex rounded-full border-2 border-ink bg-lime px-3 py-1 text-xs font-bold uppercase text-[#1A1440]">
              {count} essays
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
