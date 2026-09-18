"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import type { Article, Author, Topic } from "@/lib/data";
import { formatCount, formatDateRelative } from "@/lib/data";

interface MobileFeedProps {
  articles: Article[];
  trending: Article[];
  topics: Topic[];
  authors: Map<string, Author>;
  topicsMap: Map<string, Topic>;
}

export function MobileFeedView({
  articles,
  trending,
  topics,
  authors,
  topicsMap,
}: MobileFeedProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "topics">("feed");

  return (
    <div className="md:hidden w-full pb-8">
      {/* ── Native Segmented Mobile Tabs ── */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur-md pt-2 pb-3 px-4 border-b border-ink/10 mb-4">
        <div className="flex bg-card border border-ink/15 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === "feed"
                ? "bg-purple text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Feed ✦
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trending")}
            className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === "trending"
                ? "bg-purple text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Trending 🔥
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topics")}
            className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === "topics"
                ? "bg-purple text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Topics 🏷️
          </button>
        </div>
      </div>

      {/* ── Tab Content: FEED ── */}
      {activeTab === "feed" && (
        <div className="px-4 space-y-3.5">
          {articles.map((article) => {
            const author = authors.get(article.authorUsername);
            const topic = topicsMap.get(article.topicSlug);
            return (
              <article
                key={article.slug}
                className="bg-card border border-ink/15 rounded-2xl p-4 shadow-sm active:border-purple transition-all"
              >
                <div className="flex items-center gap-2 mb-2 font-mono text-[11px] text-subtle">
                  {author && (
                    <Avatar
                      initials={author.initials}
                      color={author.avatarColor}
                      size="sm"
                      src={author.avatarUrl}
                    />
                  )}
                  <span className="font-semibold text-ink truncate">
                    {author?.name || article.authorUsername}
                  </span>
                  <span>·</span>
                  <span className="text-purple font-medium">
                    {topic?.name || article.topicSlug}
                  </span>
                  <span className="ml-auto shrink-0 font-medium">
                    {article.readingTime} min
                  </span>
                </div>

                <Link href={`/article/${article.slug}`}>
                  <h3 className="text-[17px] font-bold leading-snug mb-1.5 text-ink hover:text-purple transition-colors">
                    {article.title}
                  </h3>
                </Link>

                <p className="text-[13px] leading-relaxed text-muted line-clamp-2 mb-3">
                  {article.dek}
                </p>

                <div className="flex items-center justify-between font-mono text-[11px] text-subtle pt-2 border-t border-ink/10">
                  <span>{formatDateRelative(article.publishedAt)}</span>
                  <span className="font-bold text-ink bg-bg px-2 py-0.5 rounded border border-ink/10">
                    ▲ {formatCount(article.reactions)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Tab Content: TRENDING ── */}
      {activeTab === "trending" && (
        <div className="px-4 space-y-3">
          {trending.map((article, idx) => {
            const author = authors.get(article.authorUsername);
            const topic = topicsMap.get(article.topicSlug);
            return (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                className="flex items-start gap-3 bg-card border border-ink/15 rounded-2xl p-4 shadow-sm hover:border-purple transition-all"
              >
                <span className="text-[24px] font-extrabold text-purple leading-none shrink-0 w-6 text-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-subtle mb-1">
                    {author?.name} · {topic?.name} · {article.readingTime} min read
                  </div>
                  <h3 className="text-[16px] font-bold leading-snug text-ink mb-1">
                    {article.title}
                  </h3>
                  <div className="font-mono text-[11px] font-bold text-purple">
                    ▲ {formatCount(article.reactions)} reactions
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Tab Content: TOPICS ── */}
      {activeTab === "topics" && (
        <div className="px-4 grid grid-cols-2 gap-3">
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/topic/${t.slug}`}
              className="bg-card border border-ink/15 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-purple transition-all"
            >
              <span className="text-[32px] mb-2">{t.emoji}</span>
              <div>
                <div className="font-bold text-[15px] text-ink leading-tight">
                  {t.name}
                </div>
                <div className="font-mono text-[11px] text-subtle mt-0.5">
                  #{t.slug}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
