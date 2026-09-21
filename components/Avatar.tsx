"use client";

import { useState } from "react";
import type { AvatarColor } from "@/lib/data";

const colorMap: Record<AvatarColor, string> = {
  purple: "bg-[#7C5CFF] text-white",
  pink: "bg-[#FF7AC6] text-[#1A1440]",
  sky: "bg-[#6FD3FF] text-[#1A1440]",
  peach: "bg-[#FFB86B] text-[#1A1440]",
  lime: "bg-[#C6FF3D] text-[#1A1440]",
  emerald: "bg-[#34D399] text-[#052E16]",
  rose: "bg-[#FB7185] text-[#4C0519]",
  amber: "bg-[#FBBF24] text-[#451A03]",
  indigo: "bg-[#6366F1] text-white",
  ink: "bg-[#130E29] text-white",
};

const sizeMap = {
  sm: "w-8 h-8 text-[12px] rounded-lg shadow-pop-sm",
  md: "w-11 h-11 text-[15px] rounded-xl shadow-pop-sm",
  lg: "w-16 h-16 text-[22px] rounded-2xl shadow-pop",
  xl: "w-24 h-24 text-[34px] rounded-2xl shadow-pop-lg",
};

export function Avatar({
  initials,
  color = "purple",
  size = "md",
  rotate,
  src,
}: {
  initials: string;
  color?: AvatarColor;
  size?: keyof typeof sizeMap;
  rotate?: boolean;
  /** Uploaded profile image — shown instead of initials when present. */
  src?: string | null;
}) {
  // A deleted/expired storage object must never surface as a broken-image
  // glyph — degrade to the initials tile instead.
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
        className={`avatar ${sizeMap[size]} object-cover bg-card ${
          rotate ? "-rotate-6" : ""
        }`}
      />
    );
  }
  return (
    <span
      className={`avatar ${colorMap[color]} ${sizeMap[size]} ${
        rotate ? "-rotate-6" : ""
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

