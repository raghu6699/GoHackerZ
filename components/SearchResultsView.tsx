"use client";

import { useState } from "react";
import Link from "next/link";
import { ArticleCardView } from "./ArticleCardView";
import { Avatar } from "./Avatar";
import type { Article, Author, Topic } from "@/lib/data";

interface TopicWithCount extends Topic {
  count: number;
}

interface SearchResultsViewProps {
  query: string;
  articles: Article[];
  authors: Author[];
  topics: TopicWithCount[];
  cardAuthors: Record<string, Author>;
  cardTopics: Record<string, Topic>;
}

export function SearchResultsView({
  query,
  articles,
  authors,
  topics,
  cardAuthors,
  cardTopics,
}: SearchResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "topics" | "essays" | "writers">("all");
  const totalCount = articles.length + authors.length + topics.length;

  if (totalCount === 0) {
    return (
      <div className="card p-10 sm:p-14 text-center shadow-pop">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-2xl font-bold mb-2">Nothing found for &ldquo;{query}&rdquo;</h3>
        <p className="text-muted text-base max-w-md mx-auto mb-6">
          We couldn&rsquo;t find any topics, essays, or writers matching your keywords.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/topics" className="btn btn-purple">
            Browse All Topics ✦
          </Link>
          <Link href="/read" className="btn btn-lime">
            Explore Latest Feed
          </Link>
        </div>
      </div>
    );
  }

  const showTopics = (activeTab === "all" || activeTab === "topics") && topics.length > 0;
  const showWriters = (activeTab === "all" || activeTab === "writers") && authors.length > 0;
  const showEssays = (activeTab === "all" || activeTab === "essays") && articles.length > 0;

  return (
    <div>
      {/* ── Summary & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-ink/10">
        <p className="font-mono text-xs text-subtle">
          <span className="font-bold text-ink">{totalCount}</span> results for &ldquo;{query}&rdquo;
        </p>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-xl text-xs font-bold border-2 transition-all ${
              activeTab === "all"
                ? "bg-purple text-white border-ink shadow-pop-sm"
                : "bg-card text-ink border-transparent hover:border-ink/20"
            }`}
          >
            All ({totalCount})
          </button>

          {topics.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("topics")}
              className={`px-3 py-1 rounded-xl text-xs font-bold border-2 transition-all ${
                activeTab === "topics"
                  ? "bg-purple text-white border-ink shadow-pop-sm"
                  : "bg-card text-ink border-transparent hover:border-ink/20"
              }`}
            >
              Topics ({topics.length})
            </button>
          )}

          {articles.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("essays")}
              className={`px-3 py-1 rounded-xl text-xs font-bold border-2 transition-all ${
                activeTab === "essays"
                  ? "bg-purple text-white border-ink shadow-pop-sm"
                  : "bg-card text-ink border-transparent hover:border-ink/20"
              }`}
            >
              Essays ({articles.length})
            </button>
          )}

          {authors.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("writers")}
              className={`px-3 py-1 rounded-xl text-xs font-bold border-2 transition-all ${
                activeTab === "writers"
                  ? "bg-purple text-white border-ink shadow-pop-sm"
                  : "bg-card text-ink border-transparent hover:border-ink/20"
              }`}
            >
              Writers ({authors.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Topics Results Section ── */}
      {showTopics && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple flex items-center gap-2">
              <span>Topics</span>
              <span className="text-subtle">({topics.length})</span>
            </h2>
            <Link href="/topics" className="font-mono text-xs text-subtle hover:text-purple underline">
              View directory →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link
                key={t.slug}
                href={`/topic/${t.slug}`}
                className="card card-hover block p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl shrink-0">{t.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate leading-tight">{t.name}</h3>
                    <div className="font-mono text-xs uppercase text-subtle">#{t.slug}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-2">
                  {t.description}
                </p>
                <div className="mt-4 inline-flex rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-xs font-bold uppercase text-[#1A1440]">
                  {t.count} {t.count === 1 ? "essay" : "essays"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Writers Results Section ── */}
      {showWriters && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple flex items-center gap-2">
              <span>Writers</span>
              <span className="text-subtle">({authors.length})</span>
            </h2>
          </div>

          <div className="flex gap-3 flex-wrap">
            {authors.map((a) => (
              <Link
                key={a.username}
                href={`/writer/${a.username}`}
                className="card card-hover p-4 flex items-center gap-3"
              >
                <Avatar initials={a.initials} color={a.avatarColor} size="sm" src={a.avatarUrl} />
                <div>
                  <b className="text-[14px] leading-tight block">{a.name}</b>
                  <div className="font-mono text-[11px] text-subtle">
                    @{a.username} · {a.articleCount} {a.articleCount === 1 ? "essay" : "essays"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Essays Results Section ── */}
      {showEssays && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple flex items-center gap-2">
              <span>Essays</span>
              <span className="text-subtle">({articles.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((a) => {
              const author = cardAuthors[a.authorUsername];
              const topic = cardTopics[a.topicSlug];
              if (!author || !topic) return null;
              return (
                <ArticleCardView
                  key={a.slug}
                  article={a}
                  author={author}
                  topic={topic}
                  variant="grid"
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
