"use client";

import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "full" | "mark";
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
    sm: variant === "full" ? "h-6 sm:h-7" : "h-7 w-7",
    md: variant === "full" ? "h-8 sm:h-9" : "h-9 w-9",
    lg: variant === "full" ? "h-10 sm:h-12" : "h-12 w-12",
  };

  const currentHeight = heights[size] || heights.md;

  const logoContent = (
    <div
      className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] select-none group ${className}`}
    >
      {variant === "full" ? (
        <>
          {/* Light background logo (dark artwork) */}
          <img
            src="/logo/logo-full-dark.png"
            alt="GoHackerz"
            className={`${currentHeight} w-auto object-contain ${
              light ? "hidden" : "dark:hidden block"
            }`}
          />
          {/* Dark background logo (white artwork) */}
          <img
            src="/logo/logo-full-white.png"
            alt="GoHackerz"
            className={`${currentHeight} w-auto object-contain ${
              light ? "block" : "hidden dark:block"
            }`}
          />
        </>
      ) : (
        <>
          {/* Light background icon mark */}
          <img
            src="/logo/logo-mark-dark.png"
            alt="GoHackerz Mark"
            className={`${currentHeight} object-contain ${
              light ? "hidden" : "dark:hidden block"
            }`}
          />
          {/* Dark background icon mark */}
          <img
            src="/logo/logo-mark-white.png"
            alt="GoHackerz Mark"
            className={`${currentHeight} object-contain ${
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
