"use client";

import { useMemo, useState } from "react";
import { ArticleCardView } from "./ArticleCardView";
import type { Article, Author, Topic } from "@/lib/data";

interface ArticlesExplorerProps {
  articles: Article[];
  authors: Record<string, Author>;
  topics: Record<string, Topic>;
  searchPlaceholder?: string;
  showTopicFilter?: boolean;
  allTopicsList?: Topic[];
  emptyMessage?: string;
  defaultSort?: "newest" | "reactions" | "readingTime";
}

export function ArticlesExplorer({
  articles,
  authors,
  topics,
  searchPlaceholder = "Search essays by title, tag, or author…",
  showTopicFilter = false,
  allTopicsList = [],
  emptyMessage = "No essays found matching your filter.",
  defaultSort = "newest",
}: ArticlesExplorerProps) {
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [lengthFilter, setLengthFilter] = useState<"all" | "quick" | "deep">("all");
  const [sortBy, setSortBy] = useState<"newest" | "reactions" | "readingTime">(defaultSort);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  // Derive unique topics present in current articles list if allTopicsList not provided
  const availableTopics = useMemo(() => {
    if (allTopicsList.length > 0) return allTopicsList;
    const slugs = Array.from(new Set(articles.map((a) => a.topicSlug).filter(Boolean)));
    return slugs
      .map((slug) => topics[slug])
      .filter((t): t is Topic => Boolean(t));
  }, [allTopicsList, articles, topics]);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();

    return articles
      .filter((article) => {
        // Topic filter
        if (selectedTopic !== "all" && article.topicSlug !== selectedTopic) {
          return false;
        }

        // Reading time length filter
        if (lengthFilter === "quick" && article.readingTime >= 5) {
          return false;
        }
        if (lengthFilter === "deep" && article.readingTime < 5) {
          return false;
        }

        // Search query filter
        if (!q) return true;

        const author = authors[article.authorUsername];
        const topic = topics[article.topicSlug];

        const matchTitle = article.title.toLowerCase().includes(q);
        const matchDek = (article.dek || "").toLowerCase().includes(q);
        const matchTags = article.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchAuthor =
          article.authorUsername.toLowerCase().includes(q) ||
          (author && author.name.toLowerCase().includes(q));
        const matchTopic =
          article.topicSlug.toLowerCase().includes(q) ||
          (topic && topic.name.toLowerCase().includes(q));

        return matchTitle || matchDek || matchTags || matchAuthor || matchTopic;
      })
      .sort((a, b) => {
        if (sortBy === "reactions") {
          return (b.reactions ?? 0) - (a.reactions ?? 0);
        }
        if (sortBy === "readingTime") {
          return (b.readingTime ?? 0) - (a.readingTime ?? 0);
        }
        // default "newest"
        const dateA = new Date(a.publishedAt).getTime() || 0;
        const dateB = new Date(b.publishedAt).getTime() || 0;
        return dateB - dateA;
      });
  }, [articles, authors, topics, query, selectedTopic, lengthFilter, sortBy]);

  const hasActiveFilters =
    query.trim() !== "" || selectedTopic !== "all" || lengthFilter !== "all";

  const clearAllFilters = () => {
    setQuery("");
    setSelectedTopic("all");
    setLengthFilter("all");
  };

  return (
    <div>
      {/* ── Search & Filter Controls ── */}
      <div className="mb-8 rounded-3xl border-2 border-ink bg-card p-4 sm:p-5 shadow-pop">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle text-base select-none">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-ink bg-bg text-ink shadow-pop-sm outline-none focus:border-purple transition-all font-medium text-[14.5px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink/10 hover:bg-ink/20 text-ink text-xs font-bold flex items-center justify-center transition-colors"
                title="Clear query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick controls: Sort & Layout */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Selector */}
            <select
              value={sortBy}
              aria-label="Sort essays by"
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "reactions" | "readingTime")
              }
              className="border-2 border-ink bg-bg text-ink rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-pop-sm focus:border-purple"
            >
              <option value="newest">Newest first</option>
              <option value="reactions">Most reacted 🔥</option>
              <option value="readingTime">Longest read ⏳</option>
            </select>

            {/* Length filter */}
            <select
              value={lengthFilter}
              aria-label="Filter essays by reading time"
              onChange={(e) =>
                setLengthFilter(e.target.value as "all" | "quick" | "deep")
              }
              className="border-2 border-ink bg-bg text-ink rounded-xl px-3 py-2 text-xs font-bold outline-none shadow-pop-sm focus:border-purple"
            >
              <option value="all">All lengths</option>
              <option value="quick">Quick (&lt; 5m)</option>
              <option value="deep">Deep Dives (5m+)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex border-2 border-ink rounded-xl overflow-hidden bg-bg shadow-pop-sm">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "grid"
                    ? "bg-purple text-white"
                    : "text-ink hover:bg-card"
                }`}
              >
                ⊞
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                aria-label="Compact list view"
                title="Compact list view"
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "compact"
                    ? "bg-purple text-white"
                    : "text-ink hover:bg-card"
                }`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Optional Topic Filter Bar */}
        {showTopicFilter && availableTopics.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-ink/10 flex-wrap">
            <span className="font-mono text-xs text-subtle font-bold uppercase tracking-wider mr-1">
              Topic:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTopic("all")}
              className={`chip text-xs transition-all ${
                selectedTopic === "all"
                  ? "bg-purple text-white shadow-pop-sm"
                  : "bg-bg hover:border-purple text-ink"
              }`}
            >
              All Topics
            </button>
            {availableTopics.map((t) => {
              const isActive = selectedTopic === t.slug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setSelectedTopic(isActive ? "all" : t.slug)}
                  className={`chip text-xs transition-all ${
                    isActive
                      ? "bg-purple text-white shadow-pop-sm"
                      : "bg-bg hover:border-purple text-ink"
                  }`}
                >
                  {t.emoji} {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Result Count & Reset line ── */}
      <div className="flex items-center justify-between font-mono text-xs text-subtle mb-5 px-1">
        <span>
          Showing {filteredArticles.length} of {articles.length} essays
          {query ? ` for "${query}"` : ""}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="font-bold text-purple underline hover:text-ink transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Articles List / Grid ── */}
      {filteredArticles.length > 0 ? (
        viewMode === "compact" ? (
          <div className="border-2 border-ink rounded-3xl bg-card overflow-hidden shadow-pop">
            {filteredArticles.map((article) => {
              const author = authors[article.authorUsername];
              const topic = topics[article.topicSlug];
              if (!author || !topic) return null;
              return (
                <ArticleCardView
                  key={article.slug}
                  article={article}
                  author={author}
                  topic={topic}
                  variant="compact"
                />
              );
            })}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.map((article) => {
              const author = authors[article.authorUsername];
              const topic = topics[article.topicSlug];
              if (!author || !topic) return null;
              return (
                <ArticleCardView
                  key={article.slug}
                  article={article}
                  author={author}
                  topic={topic}
                  variant="grid"
                />
              );
            })}
          </section>
        )
      ) : (
        <div className="card p-10 text-center shadow-pop max-w-xl mx-auto my-6">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="text-xl font-bold mb-2">No matching essays</h3>
          <p className="text-muted text-sm mb-5">
            {emptyMessage}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-purple"
            >
              Reset search &amp; filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
