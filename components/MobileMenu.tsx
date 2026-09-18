"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  Tag,
  Info,
  Search,
  PenTool,
  LogIn,
  X,
  Menu,
  MessageSquare,
} from "lucide-react";

const links = [
  { href: "/read", label: "Feed", icon: BookOpen },
  { href: "/deep-dives", label: "Deep Dives", icon: Sparkles },
  { href: "/topics", label: "Topics", icon: Tag },
  { href: "/guestbook", label: "Guestbook Wall", icon: MessageSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/about", label: "About", icon: Info },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape key
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
        aria-controls="mobile-menu-dropdown"
        aria-label={open ? "Close menu" : "Open menu"}
        className="btn btn-sm px-2.5 py-2 bg-card text-ink flex items-center justify-center min-h-[38px] min-w-[38px]"
      >
        {open ? <X className="w-5 h-5 text-purple" /> : <Menu className="w-5 h-5 text-purple" />}
      </button>

      {open && (
        <div
          id="mobile-menu-dropdown"
          className="absolute top-full left-0 right-0 bg-bg/98 backdrop-blur-lg border-b-2 border-ink shadow-2xl z-50 anim-pop"
        >
          <nav className="wrap py-4 flex flex-col gap-2" aria-label="Mobile Navigation Menu">
            {links.map((l) => {
              const Icon = l.icon;
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${
                    isActive
                      ? "bg-purple text-white shadow-pop-sm"
                      : "bg-card hover:bg-card/80 text-ink border border-ink/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-purple"}`} />
                  {l.label}
                </Link>
              );
            })}

            <div className="my-1 border-t border-dashed border-ink/15" />

            <div className="flex gap-2.5 pt-1">
              <Link
                href="/write"
                onClick={() => setOpen(false)}
                className="btn btn-purple flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                Write ✦
              </Link>
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="btn btn-lime flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}