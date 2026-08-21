"use client";

import { useState } from "react";
import { formatCount } from "@/lib/data";

export function ArticleActions({
  initialReactions,
  comments,
}: {
  initialReactions: number;
  comments: number;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex items-center gap-3 relative">
      <button
        onClick={() => {
          setReactions((r) => (reacted ? r - 1 : r + 1));
          setReacted((v) => !v);
        }}
        className={`btn btn-sm ${reacted ? "btn-lime" : ""}`}
        aria-pressed={reacted}
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
        onClick={() => setSaved((v) => !v)}
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
  );
}
