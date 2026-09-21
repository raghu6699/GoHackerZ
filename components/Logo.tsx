"use client";

import Link from "next/link";

interface LogoProps {
  variant?: "full" | "header" | "footer" | "mark";
  size?: "sm" | "md" | "lg";
  light?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  light = false,
  className = "",
  href = "/",
}: LogoProps) {
  const isFooter = light || variant === "footer";
  const isMark = variant === "mark";

  // Height sizing for generous, readable branding
  const heights = {
    sm: isMark ? "h-8 w-8" : isFooter ? "h-12" : "h-9",
    md: isMark ? "h-10 w-10" : isFooter ? "h-16 sm:h-20" : "h-11 sm:h-13",
    lg: isMark ? "h-12 w-12" : isFooter ? "h-20 sm:h-24" : "h-13 sm:h-16",
  };

  const currentHeight = heights[size] || heights.md;

  const logoSrc = isFooter
    ? "/logo/footer-logo.png" // GoHackerz Dark Theme Brand Lockup
    : isMark
    ? "/logo/mark-logo.png" // GoHackerz neon terminal icon
    : "/logo/header-logo.png"; // GoHackerz neon terminal logo

  const logoContent = (
    <div
      className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.03] active:scale-95 select-none group ${className}`}
    >
      <img
        src={logoSrc}
        alt="GoHackerz"
        className={`${currentHeight} w-auto object-contain drop-shadow-md`}
      />
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
