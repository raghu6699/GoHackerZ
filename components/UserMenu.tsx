"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Avatar } from "./Avatar";
import type { User } from "@supabase/supabase-js";

/**
 * Signed-in identity in the navbar: avatar + chevron that opens a
 * polished dropdown (Profile · Your Posts · Following · Sign out).
 * Shows a plain "Sign in" link when logged out.
 */
export function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Unconfigured env → stay signed-out view instead of crashing the layout.
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) {
    // Reserve space so nothing jumps once the session resolves
    return <span className="hidden sm:inline-block w-[92px] h-10" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/signin" className="tlink hidden sm:inline-block">
        Sign in
      </Link>
    );
  }

  const name =
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "you";

  async function signOut() {
    setOpen(false);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const items = [
    { href: "/profile", label: "Edit profile", emoji: "👤" },
    { href: "/profile?tab=posts", label: "Your posts", emoji: "📝" },
    { href: "/profile?tab=following", label: "Following", emoji: "💜" },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 border-2 border-ink rounded-xl pl-1 pr-2.5 py-1 bg-card shadow-pop-sm transition-all duration-150 hover:-translate-y-[1px] hover:shadow-pop ${
          open ? "-translate-y-[1px] shadow-pop" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <Avatar initials={name.slice(0, 2).toUpperCase()} color="purple" size="sm" src={user.user_metadata?.avatar_url as string | undefined} />
        {/* Name hidden on phones — avatar alone keeps the bar inside narrow viewports */}
        <span className="hidden sm:inline font-bold text-[13px] max-w-[90px] truncate">{name}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="anim-pop absolute right-0 top-[calc(100%+8px)] w-56 card p-2 z-50 origin-top-right"
        >
          <div className="px-3 py-2 mb-1 border-b-2 border-dashed border-ink/15">
            <div className="font-bold text-[14px] truncate">{name}</div>
            <div className="font-mono text-[11px] text-subtle truncate">
              {user.email}
            </div>
          </div>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium hover:bg-bg hover:text-purple transition-colors"
              role="menuitem"
            >
              <span>{it.emoji}</span> {it.label}
            </Link>
          ))}
          <div className="border-t-2 border-dashed border-ink/15 my-1" />
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium text-left hover:bg-peach/40 transition-colors"
            role="menuitem"
          >
            <span>👋</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}