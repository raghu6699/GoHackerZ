"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Feed" },
  { href: "/topic/systems", label: "Deep Dives" },
  { href: "/search", label: "Search" },
  { href: "/#topics", label: "Topics" },
  { href: "/writer/maya", label: "Writers" },
];

/**
 * Mobile hamburger menu — the desktop link row is hidden below `md`, so
 * without this, phone users had no way to reach Search / Topics / Writers.
 * Closes on navigation and on Escape; locks body scroll while open.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever the route changes (covers Link navigations too)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="btn btn-sm px-2.5 py-2 bg-card text-ink"
      >
        <span className="relative block w-[18px] h-[14px]" aria-hidden>
          {/* hamburger → X */}
          <span
            className={`absolute left-0 top-0 w-full h-[2px] bg-current transition-transform duration-200 ${open ? "translate-y-[6px] rotate-45" : ""}`}
          />
          <span
            className={`absolute left-0 top-[6px] w-full h-[2px] bg-current transition-opacity duration-150 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`absolute left-0 top-[12px] w-full h-[2px] bg-current transition-transform duration-200 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="anim-pop absolute left-0 right-0 top-full bg-bg border-b-2 border-ink shadow-[0_8px_0_rgba(26,20,64,0.08)]"
        >
          <nav className="wrap py-3 flex flex-col" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[16px] font-semibold px-3 py-3 rounded-xl hover:bg-card active:bg-card transition-colors border-b-2 border-dashed border-ink/10 last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/signin" className="btn btn-sm mt-3 mx-3 mb-1">
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}