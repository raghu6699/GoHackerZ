"use client";

import Link from "next/link";

interface LogoProps {
  variant?: "full" | "mark" | "cyber";
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
  // Height sizing for exact proportional rendering
  const heights = {
    sm: variant === "mark" ? "h-7 w-7" : "h-7 sm:h-8",
    md: variant === "mark" ? "h-9 w-9" : "h-9 sm:h-10",
    lg: variant === "mark" ? "h-12 w-12" : "h-11 sm:h-14",
  };

  const currentHeight = heights[size] || heights.md;

  const logoContent = (
    <div
      className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.03] active:scale-95 select-none group ${className}`}
    >
      {variant === "mark" ? (
        <img
          src="/logo/logo-mark-neon.png"
          alt="GoHackerz Icon"
          className={`${currentHeight} object-contain drop-shadow-md`}
        />
      ) : variant === "cyber" ? (
        <img
          src="/logo/logo-full-cyber.png"
          alt="GoHackerz Cyber"
          className={`${currentHeight} w-auto object-contain drop-shadow-md`}
        />
      ) : (
        <>
          {/* Light background logo (flat clean version) */}
          <img
            src="/logo/logo-full-flat.png"
            alt="GoHackerz"
            className={`${currentHeight} w-auto object-contain ${
              light ? "hidden" : "dark:hidden block"
            }`}
          />
          {/* Dark background logo (cyber colored lockup) */}
          <img
            src="/logo/logo-full-cyber.png"
            alt="GoHackerz"
            className={`${currentHeight} w-auto object-contain ${
              light ? "block" : "hidden dark:block"
            }`}
          />
        </>
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
