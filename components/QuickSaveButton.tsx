"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export function QuickSaveButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    // Check for pending bookmark action stored before sign in
    try {
      const rawPending = localStorage.getItem("gohackerz_pending_action");
      if (rawPending) {
        const pending = JSON.parse(rawPending);
        if (
          pending?.type === "bookmark" &&
          pending?.slug === slug &&
          Date.now() - (pending.timestamp || 0) < 15 * 60 * 1000
        ) {
          localStorage.removeItem("gohackerz_pending_action");
          fetch(`/api/articles/${slug}/bookmark`, { method: "POST" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (!cancelled && data) {
                setSaved(data.saved);
                showToast("Welcome back! Saved to your profile ★");
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore storage error
    }

    fetch(`/api/articles/${slug}/bookmark`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSaved(data.saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, showToast]);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    // Instant optimistic update on tap/click (<1ms feedback)
    const nextSaved = !saved;
    setSaved(nextSaved);
    setBusy(true);

    try {
      const res = await fetch(`/api/articles/${slug}/bookmark`, { method: "POST" });
      if (res.status === 401) {
        setSaved(!nextSaved);
        try {
          localStorage.setItem(
            "gohackerz_pending_action",
            JSON.stringify({ type: "bookmark", slug, timestamp: Date.now() })
          );
        } catch {
          // ignore storage error
        }
        showToast("Sign in to save posts — redirecting... ✦");
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
        setTimeout(() => {
          router.push(`/signin?redirect=${currentPath}`);
        }, 500);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
        showToast(data.saved ? "Saved to your profile ★" : "Removed from saved posts");
      } else {
        setSaved(!nextSaved);
      }
    } catch {
      setSaved(!nextSaved);
      showToast("Couldn't save post — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={busy}
      title={saved ? "Remove from saved articles" : "Save article for later"}
      aria-label={saved ? "Saved article" : "Save article"}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border text-[13px] transition-all shrink-0 select-none ${
        saved
          ? "bg-purple text-white border-purple shadow-pop-sm scale-105"
          : "bg-card border-ink/15 text-subtle hover:border-purple hover:text-purple hover:bg-purple/10"
      }`}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}
