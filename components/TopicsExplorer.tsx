"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Topic } from "@/lib/data";

interface TopicItem {
  topic: Topic;
  count: number;
}

export function TopicsExplorer({ topics }: { topics: TopicItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Suggested popular topic chips for quick clicking
  const quickFilters = [
    { label: "AI", query: "ai" },
    { label: "Systems", query: "systems" },
    { label: "Databases", query: "database" },
    { label: "Rust", query: "rust" },
    { label: "DevOps", query: "devops" },
    { label: "Web", query: "web" },
    { label: "Security", query: "security" },
  ];

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter(({ topic }) => {
      if (selectedTag && topic.slug !== selectedTag && !topic.slug.includes(selectedTag)) {
        return false;
      }
      if (!q) return true;
      return (
        topic.name.toLowerCase().includes(q) ||
        topic.slug.toLowerCase().includes(q) ||
        (topic.description && topic.description.toLowerCase().includes(q))
      );
    });
  }, [topics, query, selectedTag]);

  const handleQuickFilter = (qf: string) => {
    if (query.toLowerCase() === qf.toLowerCase()) {
      setQuery("");
    } else {
      setQuery(qf);
    }
  };

  const clearAll = () => {
    setQuery("");
    setSelectedTag(null);
  };

  return (
    <div>
      {/* ── Search & Filter Controls ── */}
      <div className="mb-8 rounded-3xl border-2 border-ink bg-card p-4 sm:p-6 shadow-pop">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle text-base select-none">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics by name, tag, or description… (e.g. machine, rust, database)"
            className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-ink bg-bg text-ink shadow-pop-sm outline-none focus:border-purple transition-all font-medium text-[15px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink/10 hover:bg-ink/20 text-ink text-xs font-bold flex items-center justify-center transition-colors"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="font-mono text-xs text-subtle font-bold uppercase tracking-wider">
            Quick filter:
          </span>
          {quickFilters.map((qf) => {
            const isActive = query.toLowerCase() === qf.query.toLowerCase();
            return (
              <button
                key={qf.label}
                type="button"
                onClick={() => handleQuickFilter(qf.query)}
                className={`chip text-xs transition-all ${
                  isActive
                    ? "bg-purple text-white shadow-pop-sm"
                    : "bg-bg hover:border-purple text-ink"
                }`}
              >
                {qf.label}
              </button>
            );
          })}
          {(query || selectedTag) && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-mono font-bold text-purple underline ml-1 hover:text-ink transition-colors"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* ── Status line ── */}
      <div className="flex items-center justify-between font-mono text-xs text-subtle mb-5 px-1">
        <span>
          Showing {filteredTopics.length} of {topics.length} topics
          {query ? ` matching "${query}"` : ""}
        </span>
      </div>

      {/* ── Topics Grid ── */}
      {filteredTopics.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredTopics.map(({ topic, count }) => (
            <Link
              key={topic.slug}
              href={`/topic/${topic.slug}`}
              className="card card-hover block p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold">{topic.name}</h2>
                  <div className="font-mono text-xs uppercase text-subtle">
                    #{topic.slug}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {topic.description}
              </p>
              <div className="mt-5 inline-flex rounded-full border-2 border-ink bg-lime px-3 py-1 text-xs font-bold uppercase text-[#1A1440]">
                {count} {count === 1 ? "essay" : "essays"}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center shadow-pop max-w-xl mx-auto my-6">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-xl font-bold mb-2">No topics found</h3>
          <p className="text-muted text-sm mb-5">
            No topic matched &ldquo;{query}&rdquo;. Try another term or reset your search.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="btn btn-purple"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}
