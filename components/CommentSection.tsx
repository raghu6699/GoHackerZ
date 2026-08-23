"use client";

import { useState, useEffect } from "react";
import { Avatar } from "./Avatar";
import { formatCount, type AvatarColor } from "@/lib/data";
import { useToast } from "@/context/ToastContext";

export interface CommentItem {
  id: string;
  authorName: string;
  username?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  content: string;
  createdAt: string;
  likes: number;
  liked?: boolean;
}

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
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${articleSlug}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setComments(data.comments ?? []);
          setHasLoaded(true);
        }
      })
      .catch(() => setHasLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [articleSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (res.status === 401) {
        showToast("Sign in to join the discussion ✦");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Couldn't post comment");
      setComments((c) => [data.comment, ...c]);
      setText("");
      showToast("Comment posted ✦");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleLike(id: string) {
    // optimistic
    setComments((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              liked: !c.liked,
              likes: c.likes + (c.liked ? -1 : 1),
            }
          : c
      )
    );
    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
      if (res.status === 401) {
        setComments((cs) =>
          cs.map((c) =>
            c.id === id ? { ...c, liked: !!c.liked && !c.liked === false ? c.liked : false } : c
          )
        );
        showToast("Sign in to upvote comments ✦");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setComments((cs) =>
          cs.map((c) => (c.id === id ? { ...c, liked: data.liked, likes: data.likes } : c))
        );
      }
    } catch {
      showToast("Couldn't save your upvote — try again.");
    }
  }

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
      {!hasLoaded ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-4 w-40" />
              </div>
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((c) => {
            const isLiked = !!c.liked;
            return (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                className="card p-5 bg-card border-2 border-ink transition-transform hover:-translate-y-[1px]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={getInitials(c.authorName)}
                      color={AVATAR_COLORS[c.authorName.length % AVATAR_COLORS.length]}
                      src={c.avatarUrl}
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
