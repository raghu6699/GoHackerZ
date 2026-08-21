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

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("lore_followed_writers");
      if (saved) {
        const followedList: string[] = JSON.parse(saved);
        setIsFollowing(followedList.includes(authorUsername));
      }
    } catch {
      // storage unavailable
    }
  }, [authorUsername]);

  const handleToggle = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      const saved = localStorage.getItem("lore_followed_writers");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (nextState) {
        if (!list.includes(authorUsername)) list.push(authorUsername);
      } else {
        list = list.filter((u) => u !== authorUsername);
      }
      localStorage.setItem("lore_followed_writers", JSON.stringify(list));
    } catch {
      // storage error
    }

    if (nextState) {
      showToast(`Successfully followed ${authorName}`);
    } else {
      showToast(`Unfollowed ${authorName}`, "info");
    }

    onFollowToggle?.(nextState);
  };

  const getVariantStyles = () => {
    if (isFollowing) {
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
