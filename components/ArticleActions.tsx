"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/data";
import { useToast } from "@/context/ToastContext";

export function ArticleActions({
  slug,
  initialReactions,
  comments,
  title,
  dek,
}: {
  slug: string;
  initialReactions: number;
  comments: number;
  title?: string;
  dek?: string;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const { showToast } = useToast();

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
    setSaved(next);
    try {
      const res = await fetch(`/api/articles/${slug}/bookmark`, { method: "POST" });
      if (res.status === 401) {
        setSaved(!next);
        showToast("Sign in to save posts ✦");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
        showToast(data.saved ? "Saved to your profile ★" : "Removed from saved posts");
      }
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
    const nextReacted = !reacted;
    const nextCount = Math.max(0, reactions + (nextReacted ? 1 : -1));
    setReacted(nextReacted);
    setReactions(nextCount);

    try {
      const res = await fetch(`/api/articles/${slug}/react`, { method: "POST" });
      if (res.status === 401) {
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
      setReacted(!nextReacted);
      setReactions(reactions);
      showToast("Couldn't save your reaction — try again.");
    } finally {
      setBusy(false);
    }
  }

  const getArticleUrl = () =>
    typeof window !== "undefined"
      ? window.location.href
      : `https://go-hacker.vercel.app/article/${slug}`;

  const copyToClipboard = async () => {
    try {
      const url = getArticleUrl();
      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      showToast("Link copied to clipboard! ✦");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      showToast("Link copied!");
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const shareToPlatform = (platform: "twitter" | "whatsapp" | "facebook" | "linkedin" | "instagram") => {
    const url = getArticleUrl();
    const shareTitle = title || "Check out this engineering essay on GoHackerz";

    if (platform === "twitter") {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${shareTitle}\n\n`
      )}&url=${encodeURIComponent(url)}`;
      window.open(tweetUrl, "_blank", "noopener,noreferrer");
    } else if (platform === "whatsapp") {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${shareTitle}: ${url}`
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else if (platform === "facebook") {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer");
    } else if (platform === "linkedin") {
      const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`;
      window.open(liUrl, "_blank", "noopener,noreferrer");
    } else if (platform === "instagram") {
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ title: shareTitle, text: dek || shareTitle, url }).catch(() => {});
      } else {
        copyToClipboard();
        showToast("Link copied! Share on Instagram Stories or DM ✦");
      }
    }
    setShareMenuOpen(false);
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
        <a href="#comments" className="btn btn-sm" title="Jump to comments">
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

        <div className="relative inline-block">
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className={`btn btn-sm transition-all ${
              copied ? "btn-lime font-bold shadow-pop-sm" : ""
            }`}
            type="button"
            title="Share options"
            aria-expanded={shareMenuOpen}
          >
            {copied ? "✓ Copied!" : "↗ Share"}
          </button>

          {/* Social Share Dropdown */}
          {shareMenuOpen && (
            <div className="absolute right-0 sm:left-0 top-full mt-2 z-50 w-56 bg-card border-2 border-ink rounded-2xl p-2 shadow-pop space-y-1">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-subtle px-3 py-1 border-b border-ink/10 mb-1">
                Share Essay
              </div>
              <button
                onClick={() => shareToPlatform("twitter")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-purple hover:text-white rounded-xl transition-colors text-left"
              >
                <span>𝕏</span> Twitter / X
              </button>
              <button
                onClick={() => shareToPlatform("whatsapp")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-lime hover:text-[#1A1440] rounded-xl transition-colors text-left"
              >
                <span>💬</span> WhatsApp
              </button>
              <button
                onClick={() => shareToPlatform("facebook")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-sky hover:text-[#1A1440] rounded-xl transition-colors text-left"
              >
                <span>📘</span> Facebook
              </button>
              <button
                onClick={() => shareToPlatform("linkedin")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-purple hover:text-white rounded-xl transition-colors text-left"
              >
                <span>💼</span> LinkedIn
              </button>
              <button
                onClick={() => shareToPlatform("instagram")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-peach hover:text-[#1A1440] rounded-xl transition-colors text-left"
              >
                <span>📸</span> Instagram
              </button>
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-ink hover:bg-lime hover:text-[#1A1440] rounded-xl transition-colors text-left border-t border-ink/10 mt-1"
              >
                <span>🔗</span> Copy Link
              </button>
            </div>
          )}
        </div>
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
          onClick={() => setShareMenuOpen(!shareMenuOpen)}
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
