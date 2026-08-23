"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

interface FollowButtonProps {
  authorName: string;
  authorUsername: string;
  className?: string;
  variant?: "lime" | "purple" | "default";
  onFollowToggle?: (isFollowing: boolean) => void;
}

export function FollowButton({
  authorName,
  authorUsername,
  className = "",
  variant = "lime",
  onFollowToggle,
}: FollowButtonProps) {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  // Load real follow state from the DB
  useEffect(() => {
    let cancelled = false;
    setIsMounted(true);
    fetch(`/api/writers/${authorUsername}/follow`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setIsFollowing(!!data.following);
          setIsSelf(!!data.isSelf);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authorUsername]);

  // Viewing your own profile — there's nothing to follow
  if (isMounted && isSelf) {
    return (
      <span className="btn btn-sm bg-card text-ink border-ink font-bold select-none opacity-70 pointer-events-none">
        That&apos;s you ✦
      </span>
    );
  }

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState); // optimistic

    try {
      const res = await fetch(`/api/writers/${authorUsername}/follow`, {
        method: "POST",
      });
      if (res.status === 401) {
        setIsFollowing(!nextState);
        showToast("Sign in to follow writers ✦");
        return;
      }
      if (res.status === 400) {
        setIsFollowing(!nextState);
        showToast((await res.json()).error ?? "Can't do that.");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        if (data.following) {
          showToast(`Successfully followed ${authorName}`);
        } else {
          showToast(`Unfollowed ${authorName}`, "info");
        }
        onFollowToggle?.(data.following);
      }
    } catch {
      setIsFollowing(!nextState);
      showToast("Couldn't save that — try again.");
    } finally {
      setBusy(false);
    }
  }

  const getVariantStyles = () => {
    if (isFollowing && isMounted) {
      return "bg-card text-ink border-ink font-bold shadow-pop-sm";
    }
    if (variant === "lime") {
      return "btn-lime";
    }
    if (variant === "purple") {
      return "btn-purple";
    }
    return "btn";
  };

  return (
    <button
      id={`follow-btn-${authorUsername}`}
      type="button"
      onClick={handleToggle}
      disabled={busy}
      className={`btn btn-sm transition-all select-none ${getVariantStyles()} ${className}`}
      aria-pressed={isFollowing}
      aria-label={
        isFollowing
          ? `Unfollow ${authorName}`
          : `Follow ${authorName}`
      }
    >
      {isMounted && isFollowing ? "✓ Following" : "+ Follow"}
    </button>
  );
}

