"use client";

import { useState, useEffect } from "react";
import { Avatar } from "./Avatar";
import { formatCount, type AvatarColor } from "@/lib/data";

export interface CommentItem {
  id: string;
  authorName: string;
  initials: string;
  avatarColor: AvatarColor;
  role?: string;
  content: string;
  createdAt: string;
  likes: number;
}

const DEFAULT_COMMENTS: Record<string, CommentItem[]> = {
  "three-assumptions-destroying-tail-latencies": [
    {
      id: "c1",
      authorName: "Alex Rivera",
      initials: "AR",
      avatarColor: "sky",
      role: "Infra @ Linear",
      content:
        "The semaphore pattern for bounded concurrency hit home. We saw a 30% drop in redis socket timeouts just by failing fast instead of queueing 5,000 requests during flash spikes.",
      createdAt: "3 hours ago",
      likes: 42,
    },
    {
      id: "c2",
      authorName: "Priya Nair",
      initials: "PN",
      avatarColor: "peach",
      role: "Platform Engineer",
      content:
        "“Your p99 is your power users' p50.” Print that out and frame it in every sprint planning room. Outstanding post.",
      createdAt: "5 hours ago",
      likes: 28,
    },
    {
      id: "c3",
      authorName: "Marcus Vance",
      initials: "MV",
      avatarColor: "lime",
      role: "Backend Lead",
      content:
        "Did you measure connection pool checkout latency separately in Datadog/Prometheus? Curious what metrics you watched before and after introducing the statement cache.",
      createdAt: "1 day ago",
      likes: 15,
    },
  ],
  "postgres-is-all-you-need": [
    {
      id: "c1",
      authorName: "Sarah Chen",
      initials: "SC",
      avatarColor: "purple",
      role: "Data Architect",
      content:
        "PgBouncer in transaction pooling mode + carefully tuned autovacuum cost limits has kept our main cluster humming at 6TB without any shard headaches.",
      createdAt: "4 hours ago",
      likes: 31,
    },
    {
      id: "c2",
      authorName: "Liam O'Connor",
      initials: "LO",
      avatarColor: "pink",
      role: "SRE",
      content:
        "The query bloat snippet is pure gold. Adding that to our weekly health check script.",
      createdAt: "1 day ago",
      likes: 19,
    },
  ],
};

const AVATAR_COLORS: AvatarColor[] = ["purple", "pink", "sky", "peach", "lime", "ink"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "AN").toUpperCase();
}

export function CommentSection({
  articleSlug,
  articleTitle,
}: {
  articleSlug: string;
  articleTitle: string;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load from localStorage or defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`lore_comments_${articleSlug}`);
      const savedLikes = localStorage.getItem(`lore_comment_likes_${articleSlug}`);
      if (savedLikes) {
        setLikedMap(JSON.parse(savedLikes));
      }
      if (saved) {
        setComments(JSON.parse(saved));
      } else {
        const defaults = DEFAULT_COMMENTS[articleSlug] || [
          {
            id: "default-1",
            authorName: "Devin Foster",
            initials: "DF",
            avatarColor: "purple",
            role: "Software Engineer",
            content: "Great breakdown! Love the practical takeaways.",
            createdAt: "2 hours ago",
            likes: 8,
          },
        ];
        setComments(defaults);
      }
    } catch {
      setComments([]);
    }
    setHasLoaded(true);
  }, [articleSlug]);

  // Persist updates
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(
        `lore_comments_${articleSlug}`,
        JSON.stringify(comments)
      );
      localStorage.setItem(
        `lore_comment_likes_${articleSlug}`,
        JSON.stringify(likedMap)
      );
    } catch {
      // ignore storage quota errors
    }
  }, [comments, likedMap, articleSlug, hasLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    const authorDisplayName = name.trim() || "Anonymous Builder";
    const newColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newComment: CommentItem = {
      id: "c_" + Date.now(),
      authorName: authorDisplayName,
      initials: getInitials(authorDisplayName),
      avatarColor: newColor,
      role: "Builder",
      content: text.trim(),
      createdAt: "Just now",
      likes: 0,
    };

    setComments((prev) => [newComment, ...prev]);
    setText("");
    setIsSubmitting(false);
  };

  const toggleLike = (id: string) => {
    setLikedMap((prev) => {
      const isLiked = !!prev[id];
      setComments((list) =>
        list.map((c) =>
          c.id === id ? { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1 } : c
        )
      );
      return { ...prev, [id]: !isLiked };
    });
  };

  return (
    <section
      id="comments"
      className="mt-14 pt-8 border-t-2 border-ink scroll-mt-20"
      aria-label="Discussion"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-[12px] text-purple font-bold mb-1">
            // discussion &amp; teardowns
          </div>
          <h2 className="text-[28px] font-bold tracking-tight flex items-center gap-3">
            <span>Comments</span>
            <span className="chip bg-lime text-[#1A1440]">
              {comments.length}
            </span>
          </h2>
        </div>
        <span className="hidden sm:inline-block font-mono text-[12px] text-subtle">
          Markdown supported
        </span>
      </div>

      {/* Add Comment Form */}
      <div className="card p-6 mb-10 shadow-pop bg-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label
                htmlFor="comment-author"
                className="block font-mono text-[11px] text-subtle font-bold mb-1"
              >
                YOUR NAME / HANDLE
              </label>
              <input
                id="comment-author"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Satoshi or @builder (optional)"
                className="w-full border-2 border-ink rounded-xl px-3.5 py-2.5 text-[15px] outline-none shadow-pop-sm focus:shadow-pop transition-shadow bg-card text-ink placeholder:text-subtle"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="comment-text"
              className="block font-mono text-[11px] text-subtle font-bold mb-1"
            >
              COMMENT
            </label>
            <textarea
              id="comment-text"
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What worked or failed in your stack? Share code, metrics, or insights..."
              className="w-full border-2 border-ink rounded-xl px-4 py-3 text-[15px] leading-relaxed outline-none shadow-pop-sm focus:shadow-pop transition-shadow bg-card text-ink resize-y placeholder:text-subtle"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[13px] text-muted">
              Be honest, constructive, and respectful.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="btn btn-purple btn-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              Post comment ✦
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((c) => {
            const isLiked = !!likedMap[c.id];
            return (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                className="card p-5 bg-card border-2 border-ink transition-transform hover:-translate-y-[1px]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={c.initials}
                      color={c.avatarColor}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[15px] text-ink">
                          {c.authorName}
                        </span>
                        {c.role && (
                          <span className="font-mono text-[10.5px] bg-bg border border-ink/20 px-2 py-0.5 rounded-md text-purple font-semibold">
                            {c.role}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-subtle">
                        {c.createdAt}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLike(c.id)}
                    aria-pressed={isLiked}
                    className={`btn btn-sm text-[12px] px-2.5 py-1 transition-all ${
                      isLiked ? "btn-lime font-bold shadow-pop-sm" : "bg-card text-ink"
                    }`}
                    title={isLiked ? "Remove upvote" : "Upvote comment"}
                    aria-label={`Upvote comment by ${c.authorName}. Current count: ${c.likes}`}
                  >
                    <span className={isLiked ? "text-[#1A1440]" : "text-purple"}>▲</span> {formatCount(c.likes)}
                  </button>
                </div>

                <p className="text-[15.5px] leading-relaxed text-body pl-11 whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 text-center bg-card border-dashed">
          <div className="text-[32px] mb-2">💬</div>
          <p className="font-bold text-[16px] mb-1">No comments yet</p>
          <p className="text-[14px] text-muted">
            Be the first engineer to leave your thoughts on &ldquo;{articleTitle}&rdquo;.
          </p>
        </div>
      )}
    </section>
  );
}
