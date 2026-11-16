"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/** A floating register bar that appears once the visitor scrolls past the hero. */
export function StickyRegisterBar({ href, title, dateLabel }: { href: string; title: string; dateLabel: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-[84px] z-40 flex justify-center px-4 transition-all duration-300 md:bottom-5 ${
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-[#0B0820]/90 py-2 pl-5 pr-2 shadow-[0_10px_40px_-8px_rgba(124,92,255,0.6)] backdrop-blur-xl">
        <div className="leading-tight">
          <div className="text-sm font-extrabold text-white">{title}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/50">{dateLabel}</div>
        </div>
        <Link
          href={href}
          tabIndex={show ? 0 : -1}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#C6FF3D] px-4 py-2.5 text-sm font-extrabold text-[#1A1440]"
        >
          Register free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
