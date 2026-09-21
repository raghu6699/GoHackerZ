"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export function DeleteArticleButton({
  slug,
  title,
  variant = "button",
  onDeleted,
}: {
  slug: string;
  title: string;
  variant?: "button" | "icon" | "danger-btn";
  onDeleted?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Article deleted successfully.");
        setConfirming(false);
        if (onDeleted) {
          onDeleted();
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete article");
      }
    } catch {
      showToast("Error deleting article");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-sm bg-peach/20 hover:bg-peach text-[#8a2b00] border-ink transition-colors"
          title="Delete article"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-sm bg-peach/20 hover:bg-peach text-[#8a2b00] border-ink font-semibold transition-colors"
        >
          Delete 🗑️
        </button>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg text-left">
            <h3 className="text-xl font-bold text-ink mb-2">Delete Article?</h3>
            <p className="text-subtle text-sm mb-5">
              Are you sure you want to delete <span className="font-semibold text-ink">"{title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="btn btn-sm bg-card hover:bg-subtle/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-sm bg-peach text-[#8a2b00] font-bold"
              >
                {deleting ? "Deleting..." : "Yes, Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
