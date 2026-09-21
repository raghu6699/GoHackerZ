"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { formatCount } from "@/lib/data";
import { useToast } from "@/context/ToastContext";

function IconX({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconWhatsApp({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconFacebook({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconLinkedIn({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconInstagram({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

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
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-purple hover:text-white rounded-xl transition-colors text-left group"
              >
                <IconX className="w-4 h-4 text-ink group-hover:text-white transition-colors" />
                <span>X / Twitter</span>
              </button>
              <button
                onClick={() => shareToPlatform("whatsapp")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-[#25D366] hover:text-white rounded-xl transition-colors text-left group"
              >
                <IconWhatsApp className="w-4 h-4 text-[#25D366] group-hover:text-white transition-colors" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => shareToPlatform("facebook")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-[#1877F2] hover:text-white rounded-xl transition-colors text-left group"
              >
                <IconFacebook className="w-4 h-4 text-[#1877F2] group-hover:text-white transition-colors" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => shareToPlatform("linkedin")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-[#0A66C2] hover:text-white rounded-xl transition-colors text-left group"
              >
                <IconLinkedIn className="w-4 h-4 text-[#0A66C2] group-hover:text-white transition-colors" />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={() => shareToPlatform("instagram")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-ink hover:bg-[#E4405F] hover:text-white rounded-xl transition-colors text-left group"
              >
                <IconInstagram className="w-4 h-4 text-[#E4405F] group-hover:text-white transition-colors" />
                <span>Instagram</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-ink hover:bg-lime hover:text-[#1A1440] rounded-xl transition-colors text-left border-t border-ink/10 mt-1"
              >
                <LinkIcon className="w-4 h-4 text-purple" />
                <span>Copy Link</span>
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
