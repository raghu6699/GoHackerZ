"use client";

import Link from "next/link";

interface LogoProps {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  light?: boolean;
  accent?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  light = false,
  accent = true,
  className = "",
  href = "/",
}: LogoProps) {
  // Dimension mappings
  const sizes = {
    sm: { box: 28, text: "text-[18px]", gap: "gap-2", markOnly: false },
    md: { box: 36, text: "text-[23px]", gap: "gap-2.5", markOnly: false },
    lg: { box: 44, text: "text-[28px]", gap: "gap-3", markOnly: false },
  };

  const currentSize = sizes[size] || sizes.md;

  const logoContent = (
    <div
      className={`inline-flex items-center ${currentSize.gap} font-extrabold tracking-tight transition-all duration-200 select-none group ${className}`}
    >
      {/* Icon Mark Badge */}
      <div
        style={{ width: currentSize.box, height: currentSize.box }}
        className={`relative shrink-0 grid place-items-center rounded-[10px] sm:rounded-[12px] border-2 border-ink shadow-pop-sm group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200 ${
          light
            ? "bg-purple text-white border-white/20"
            : "bg-[#0C081A] dark:bg-card text-white border-ink"
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          className="w-[82%] h-[82%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized G outer shape */}
          <path
            d="M 68 30 C 60 22, 44 22, 33 30 C 20 40, 20 60, 33 70 C 44 78, 62 77, 68 68 C 72 62, 72 52, 72 49 L 46 49"
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Terminal Prompt Chevron & Cursor (> |) */}
          <path
            d="M 39 37 L 46 43 L 39 49"
            fill="none"
            stroke={accent ? "#C6FF3D" : "currentColor"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="52"
            y1="36"
            x2="52"
            y2="50"
            stroke={accent ? "#C6FF3D" : "currentColor"}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {variant === "full" && (
        <span
          className={`font-mono font-black ${currentSize.text} ${
            light ? "text-white" : "text-ink"
          } tracking-tighter group-hover:text-purple transition-colors`}
        >
          GoHackerz
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
