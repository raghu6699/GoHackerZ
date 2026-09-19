"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NavAuth } from "./NavAuth";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/", label: "Feed" },
  { href: "/deep-dives", label: "Deep Dives" },
  { href: "/topics", label: "Topics" },
  { href: "/guestbook", label: "Guestbook" },
  { href: "/about", label: "About" },
  { href: "/search", label: "Search" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-2 sm:top-4 z-50 wrap px-3 sm:px-6 transition-all my-2">
      <div className="bg-card/95 backdrop-blur-md border-2 border-ink rounded-2xl px-3.5 sm:px-5 py-2.5 shadow-pop flex items-center justify-between gap-3 md:gap-6">
        <Logo />
        <div className="hidden md:flex items-center gap-1.5 ml-2">
          {links.map((l) => {
            const isActive =
              l.href === "/"
                ? pathname === "/" || pathname === "/read"
                : pathname.startsWith(l.href);

            return (
              <Link
                key={l.label}
                href={l.href}
                className={`text-[14px] font-bold px-3 py-1.5 rounded-xl border-2 transition-all ${
                  isActive
                    ? "bg-purple text-white border-ink shadow-pop-sm"
                    : "border-transparent text-ink hover:bg-bg hover:border-ink/40"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2.5">
            <NavAuth />
            <Link href="/write" className="btn btn-purple shadow-pop-sm hover:shadow-pop">
              <span>Start writing</span> <span aria-hidden>✎</span>
            </Link>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}


