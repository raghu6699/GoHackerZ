"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { formatCount, type Author } from "@/lib/data";

interface WriterProfileHeaderProps {
  author: Author;
  totalReactions: number;
}

export function WriterProfileHeader({
  author,
  totalReactions,
}: WriterProfileHeaderProps) {
  const [followersDelta, setFollowersDelta] = useState(0);

  const handleFollowToggle = (isFollowing: boolean) => {
    setFollowersDelta(isFollowing ? 1 : 0);
  };

  return (
    <header className="relative overflow-hidden bg-purple text-white border-2 border-ink rounded-3xl shadow-pop-lg p-7 sm:p-10 mb-10">
      <span
        className="absolute -top-12 -right-12 w-[200px] h-[200px] bg-lime border-2 border-ink rounded-full opacity-90 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative flex flex-col sm:flex-row items-start gap-6">
        <Avatar initials={author.initials} color="peach" size="xl" />
        <div className="flex-1">
          <h1 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight leading-none mb-2">
            {author.name}
          </h1>
          <div className="font-mono text-[13px] text-[#d7d0ff] mb-4">
            {author.role} @ {author.company}
          </div>
          <p className="text-[17px] leading-relaxed text-[#ece9ff] max-w-[560px] mb-5">
            {author.bio}
          </p>
          <div className="flex gap-2.5 flex-wrap items-center">
            <span className="chip bg-lime text-[#1A1440] font-semibold">
              {formatCount(author.followers + followersDelta)} followers
            </span>
            <span className="chip bg-sky text-[#1A1440] font-semibold">
              {author.articleCount} essays
            </span>
            <span className="chip bg-pink text-[#1A1440] font-semibold">
              ▲ {formatCount(totalReactions)} reactions
            </span>
            <FollowButton
              authorName={author.name}
              authorUsername={author.username}
              variant="lime"
              onFollowToggle={handleFollowToggle}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
