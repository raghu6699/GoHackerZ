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

  // Lock body scroll while menu is open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu-drawer"
        aria-label={open ? "Close menu" : "Open menu"}
        className="btn btn-sm px-2.5 py-2 bg-card text-ink flex items-center justify-center min-h-[40px] min-w-[40px] relative z-[101]"
      >
        {open ? <X className="w-5 h-5 text-purple" /> : <Menu className="w-5 h-5 text-purple" />}
      </button>

      {open && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-ink/60 backdrop-blur-md transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            id="mobile-menu-drawer"
            className="relative w-[min(300px,82vw)] h-full bg-bg border-l-2 border-ink shadow-2xl flex flex-col p-5 z-[102] overflow-y-auto anim-pop"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-ink mb-4">
              <div className="font-bold text-lg text-ink flex items-center gap-2">
                <span className="text-xl">🚀</span> GoHackerz
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-sm px-2 py-1"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2 flex-1" aria-label="Mobile Drawer Navigation">
              {links.map((l) => {
                const Icon = l.icon;
                const isActive = pathname === l.href;
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                      isActive
                        ? "bg-purple text-white shadow-pop-sm"
                        : "bg-card hover:bg-card/80 text-ink border border-ink/10"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-purple"}`} />
                    {l.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t-2 border-dashed border-ink/15" />

              <Link
                href="/write"
                onClick={() => setOpen(false)}
                className="btn btn-purple py-3 text-center justify-center font-bold flex items-center gap-2 shadow-pop"
              >
                <PenTool className="w-4 h-4" />
                Start Writing ✦
              </Link>
            </nav>

            {/* Drawer Footer */}
            <div className="pt-4 border-t-2 border-ink mt-auto flex flex-col gap-2">
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="btn btn-lime text-center justify-center font-bold flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <div className="text-center font-mono text-[11px] text-subtle pt-2">
                © {new Date().getFullYear()} GoHackerz Platform
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}