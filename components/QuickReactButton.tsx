"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/data";
import { useToast } from "@/context/ToastContext";

export function QuickReactButton({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/articles/${slug}/react`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setCount(data.count);
          setReacted(data.reacted);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggleReact(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    const nextReacted = !reacted;
    const nextCount = Math.max(0, count + (nextReacted ? 1 : -1));
    setReacted(nextReacted);
    setCount(nextCount);

    try {
      const res = await fetch(`/api/articles/${slug}/react`, { method: "POST" });
      if (res.status === 401) {
        setReacted(!nextReacted);
        setCount(count);
        showToast("Sign in to react to posts ✦");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setReacted(data.reacted);
        setCount(data.count);
        showToast(data.reacted ? "Reacted to post ▲" : "Removed reaction");
      }
    } catch {
      setReacted(!nextReacted);
      setCount(count);
      showToast("Couldn't save your reaction — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleReact}
      disabled={busy}
      title={reacted ? "Remove your reaction" : "React to this post"}
      aria-label={reacted ? "Reacted to article" : "React to article"}
      className={`font-mono text-[11px] font-semibold border rounded-md px-2 py-0.5 shrink-0 transition-all cursor-pointer select-none flex items-center gap-1 z-10 ${
        reacted
          ? "bg-lime text-[#1A1440] border-ink font-bold shadow-pop-sm scale-105"
          : "bg-bg text-ink border-ink/15 hover:border-purple hover:text-purple"
      }`}
    >
      ▲ {formatCount(count)}
    </button>
  );
}
