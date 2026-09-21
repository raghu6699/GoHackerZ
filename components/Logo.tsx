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
  // Height sizing
  const heights = {
    sm: variant === "mark" ? "h-7 w-7" : "h-7 sm:h-8",
    md: variant === "mark" ? "h-9 w-9" : "h-9 sm:h-10",
    lg: variant === "mark" ? "h-12 w-12" : "h-11 sm:h-14",
  };

  const currentHeight = heights[size] || heights.md;

  // Determine which exact raw logo file to display
  const isFooter = light || variant === "footer";
  const isMark = variant === "mark";

  const logoSrc = isFooter
    ? "/logo/footer-logo.png" // GoHackerz Dark Theme Brand Lockup
    : isMark
    ? "/logo/mark-logo.png" // GoHackerz neon terminal icon
    : "/logo/header-logo.png"; // Clean flat GoHackerz vector logo

  const logoContent = (
    <div
      className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] active:scale-95 select-none group ${className}`}
    >
      <img
        src={logoSrc}
        alt="GoHackerz"
        className={`${currentHeight} w-auto object-contain rounded-lg`}
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
