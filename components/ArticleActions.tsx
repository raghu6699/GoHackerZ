"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/data";
import { useToast } from "@/context/ToastContext";

export function ArticleActions({
  slug,
  initialReactions,
  comments,
}: {
  slug: string;
  initialReactions: number;
  comments: number;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  // Load the real reaction + bookmark state for this viewer
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${slug}/react`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setReactions(data.count);
      })
      .catch(() => {});
    fetch(`/api/articles/${slug}/bookmark`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSaved(data.saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggleSave() {
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = await fetch(`/api/articles/${slug}/bookmark`, { method: "POST" });
      if (res.status === 401) {
        setSaved(!next);
        showToast("Sign in to save posts ✦");
        return;
      }
      const data = await res.json();
      if (res.ok) setSaved(data.saved);
    } catch {
      setSaved(!next);
      showToast("Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleReaction() {
    if (busy) return;
    setBusy(true);
    // optimistic update
    const nextReacted = !reacted;
    const nextCount = Math.max(0, reactions + (nextReacted ? 1 : -1));
    setReacted(nextReacted);
    setReactions(nextCount);

    try {
      const res = await fetch(`/api/articles/${slug}/react`, { method: "POST" });
      if (res.status === 401) {
        // revert
        setReacted(!nextReacted);
        setReactions(reactions);
        showToast("Sign in to react to posts ✦");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setReacted(data.reacted);
        setReactions(data.count);
      }
    } catch {
      // revert on network failure
      setReacted(!nextReacted);
      setReactions(reactions);
      showToast("Couldn't save your reaction — try again.");
    } finally {
      setBusy(false);
    }
  }

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const [dockVisible, setDockVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 100) {
        setDockVisible(false);
      } else {
        setDockVisible(true);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Standard inline byline buttons */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-3 relative">
        <button
          onClick={toggleReaction}
          disabled={busy}
          className={`btn btn-sm ${reacted ? "btn-lime" : ""}`}
          aria-pressed={reacted}
          title={reacted ? "Remove your reaction" : "React to this post"}
        >
          ▲ {formatCount(reactions)}
        </button>
        <a
          href="#comments"
          className="btn btn-sm"
          title="Jump to comments"
        >
          💬 {formatCount(comments)}
        </a>
        <button
          onClick={toggleSave}
          disabled={busy}
          className={`btn btn-sm ${saved ? "btn-purple" : ""}`}
          aria-pressed={saved}
          type="button"
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
        <button
          onClick={handleShare}
          className={`btn btn-sm transition-all ${
            copied ? "btn-lime font-bold shadow-pop-sm" : ""
          }`}
          type="button"
          title="Copy article link"
          aria-label={copied ? "Link copied to clipboard" : "Share article"}
        >
          {copied ? "✓ Copied!" : "↗ Share"}
        </button>
      </div>

      {/* Auto-hiding floating mobile reading action dock */}
      <div
        className={`sm:hidden fixed bottom-3 left-4 right-4 z-40 px-3 py-2 bg-bg/95 backdrop-blur-lg border-2 border-ink rounded-2xl shadow-pop flex items-center justify-around gap-2 transition-transform duration-300 ${
          dockVisible ? "translate-y-0" : "translate-y-24"
        }`}
      >
        <button
          onClick={toggleReaction}
          disabled={busy}
          className={`btn btn-sm flex-1 py-2 text-[13px] ${reacted ? "btn-lime" : ""}`}
          aria-pressed={reacted}
        >
          ▲ {formatCount(reactions)}
        </button>
        <a
          href="#comments"
          className="btn btn-sm flex-1 py-2 text-[13px] text-center"
        >
          💬 {formatCount(comments)}
        </a>
        <button
          onClick={toggleSave}
          disabled={busy}
          className={`btn btn-sm flex-1 py-2 text-[13px] ${saved ? "btn-purple" : ""}`}
          aria-pressed={saved}
          type="button"
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
        <button
          onClick={handleShare}
          className={`btn btn-sm flex-1 py-2 text-[13px] ${
            copied ? "btn-lime font-bold" : ""
          }`}
          type="button"
        >
          {copied ? "✓ Copied!" : "↗ Share"}
        </button>
      </div>
    </>
  );
}
