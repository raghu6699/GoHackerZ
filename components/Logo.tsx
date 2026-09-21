"use client";

import Link from "next/link";

interface LogoProps {
  variant?: "full" | "mark" | "dark" | "light" | "cyber";
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
          className={`${currentHeight} object-contain`}
        />
      ) : variant === "dark" ? (
        <img
          src="/logo/logo-dark-lockup.png"
          alt="GoHackerz"
          className={`${currentHeight} w-auto object-contain`}
        />
      ) : variant === "light" ? (
        <img
          src="/logo/logo-light-lockup.png"
          alt="GoHackerz"
          className={`${currentHeight} w-auto object-contain`}
        />
      ) : variant === "cyber" ? (
        <img
          src="/logo/logo-cyber-lockup.png"
          alt="GoHackerz"
          className={`${currentHeight} w-auto object-contain`}
        />
      ) : (
        <>
          {/* Light Theme Logo (Clean flat vector with dark text) */}
          <img
            src="/logo/logo-light-lockup.png"
            alt="GoHackerz"
            className={`${currentHeight} w-auto object-contain ${
              light ? "hidden" : "dark:hidden block"
            }`}
          />
          {/* Dark Theme Logo (GoHackerz Dark Theme Brand Lockup with white/neon text) */}
          <img
            src="/logo/logo-dark-lockup.png"
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
