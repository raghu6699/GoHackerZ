"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NavAuth } from "./NavAuth";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/read", label: "Feed" },
  { href: "/hackathons", label: "Hackathons", badge: "LIVE" },
  { href: "/deep-dives", label: "Deep Dives" },
  { href: "/topics", label: "Topics" },
  { href: "/guestbook", label: "Guestbook" },
  { href: "/about", label: "About" },
  { href: "/search", label: "Search" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 py-2.5 md:py-3.5 bg-bg/95 backdrop-blur-md border-b border-ink/10">
      <div className="wrap flex items-center justify-between gap-3 md:gap-6">
        <Logo />
        <div className="hidden md:flex items-center gap-1 ml-2">
          {links.map((l) => {
            const isActive =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);

            return (
              <Link
                key={l.label}
                href={l.href}
                className={`relative inline-flex items-center gap-1.5 text-[14.5px] font-semibold px-3 py-1.5 rounded-xl border-2 transition-all ${
                  isActive
                    ? "bg-card border-ink text-purple shadow-pop-sm"
                    : "border-transparent text-ink hover:bg-card hover:border-ink hover:shadow-pop-sm"
                }`}
              >
                <span>{l.label}</span>
                {l.badge && (
                  <span className="px-2 py-0.5 text-[9.5px] bg-[#E11D48] text-white font-mono font-black rounded-full shadow-sm inline-flex items-center gap-1 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 md:gap-2.5">
          <ThemeToggle />
          <NavAuth />
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/write" className="btn btn-purple">
              <span>Start writing</span> <span aria-hidden>✎</span>
            </Link>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

