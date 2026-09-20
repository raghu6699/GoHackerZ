"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

export function QuickSaveButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
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

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
