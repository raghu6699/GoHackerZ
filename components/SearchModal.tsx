"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Listen for Cmd+K or Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger can be wired from parent or global context
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const quickTopics = [
    { name: "Architecture", slug: "architecture", emoji: "🏗️" },
    { name: "Postmortems", slug: "postmortems", emoji: "🔥" },
    { name: "Databases", slug: "databases", emoji: "🗄️" },
    { name: "AI Systems", slug: "ai-engineering", emoji: "⚡" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-ink/60 backdrop-blur-md anim-pop">
      <div className="bg-card border-2 border-ink rounded-3xl shadow-pop-lg w-full max-w-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 border-b-2 border-ink flex items-center gap-3">
          <Search className="w-5 h-5 text-purple shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search essays, topics, postmortems... (press Enter)"
            className="flex-1 bg-transparent text-ink text-[16px] font-medium outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-ink/20 flex items-center justify-center text-muted hover:text-ink hover:border-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="p-5 space-y-4">
          <div>
            <span className="font-mono text-[11px] font-bold text-subtle uppercase tracking-wider block mb-2.5">
              POPULAR TOPICS
            </span>
            <div className="flex gap-2 flex-wrap">
              {quickTopics.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/topic/${t.slug}`);
                  }}
                  className="chip bg-bg hover:bg-lime hover:text-[#1A1440] transition-colors py-1.5 px-3 text-[13px]"
                >
                  <span className="mr-1">{t.emoji}</span> {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-ink/10 flex items-center justify-between text-[12px] font-mono text-subtle">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple" /> Press Enter to view full results
            </span>
            <span className="bg-bg px-2 py-0.5 rounded border border-ink/20 font-bold">
              ESC to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
