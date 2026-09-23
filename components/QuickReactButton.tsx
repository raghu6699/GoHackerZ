"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    // Check for pending reaction stored before sign in
    try {
      const rawPending = localStorage.getItem("gohackerz_pending_action");
      if (rawPending) {
        const pending = JSON.parse(rawPending);
        if (
          pending?.type === "react" &&
          pending?.slug === slug &&
          Date.now() - (pending.timestamp || 0) < 15 * 60 * 1000
        ) {
          localStorage.removeItem("gohackerz_pending_action");
          fetch(`/api/articles/${slug}/react`, { method: "POST" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (!cancelled && data) {
                setCount(data.count);
                setReacted(data.reacted);
                showToast("Welcome back! Your reaction has been recorded ▲");
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore JSON parse errors
    }

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
  }, [slug, showToast]);

  async function toggleReact(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    try {
      const res = await fetch(`/api/articles/${slug}/react`, { method: "POST" });
      if (res.status === 401) {
        try {
          localStorage.setItem(
            "gohackerz_pending_action",
            JSON.stringify({ type: "react", slug, timestamp: Date.now() })
          );
        } catch {
          // ignore storage error
        }
        showToast("Sign in to react — redirecting... ✦");
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
        setTimeout(() => {
          router.push(`/signin?redirect=${currentPath}`);
        }, 600);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setReacted(data.reacted);
        setCount(data.count);
        showToast(data.reacted ? "Reacted to post ▲" : "Removed reaction");
      }
    } catch {
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
