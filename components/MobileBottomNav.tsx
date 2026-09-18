"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, SquarePen, Search, User } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  // Auto-hide bottom nav on article pages to avoid reading clutter
  const isArticlePage = pathname.startsWith("/article/");

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setVisible(false); // scrolling down -> hide
      } else {
        setVisible(true); // scrolling up -> show
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isArticlePage) return null;

  const navItems = [
    { href: "/", label: "Feed", icon: Home },
    { href: "/topics", label: "Topics", icon: Compass },
    { href: "/write", label: "Write", icon: SquarePen, highlight: true },
    { href: "/search", label: "Search", icon: Search },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-lg border-t border-ink/15 shadow-[0_-4px_16px_rgba(26,20,64,0.06)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center relative -top-3"
              >
                <div className="w-11 h-11 rounded-xl bg-purple text-white border-2 border-ink shadow-pop flex items-center justify-center active:scale-95 transition-transform">
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-purple mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-purple font-bold" : "text-muted hover:text-ink"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 stroke-[2.5]" : "stroke-[2]"
                }`}
              />
              <span className="text-[10px] font-semibold mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-purple mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
