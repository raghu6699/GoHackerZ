"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Avatar } from "./Avatar";
import type { User } from "@supabase/supabase-js";
import {
  BookOpen,
  Sparkles,
  Tag,
  Info,
  Search,
  PenTool,
  LogIn,
  LogOut,
  User as UserIcon,
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
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Listen to Supabase auth session state
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const userName =
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Writer";

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
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 top-[57px] bg-ink/60 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />

          {/* Solid Full-Width Dropdown Sheet */}
          <div
            id="mobile-menu-dropdown"
            className="fixed left-0 right-0 top-[57px] bg-card border-b-2 border-ink shadow-2xl z-50 p-5 anim-pop max-h-[85vh] overflow-y-auto"
          >
            <nav className="flex flex-col gap-2.5" aria-label="Mobile Navigation Menu">
              {/* If user is logged in, show user info header & quick profile links */}
              {user && (
                <div className="space-y-2 mb-1">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-3 bg-purple/10 border-2 border-ink/20 rounded-xl hover:border-purple transition-all"
                  >
                    <Avatar
                      initials={userName.slice(0, 2).toUpperCase()}
                      color="purple"
                      size="sm"
                      src={user.user_metadata?.avatar_url as string | undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[14px] text-ink truncate">{userName}</div>
                      <div className="font-mono text-[11px] text-subtle truncate">{user.email}</div>
                    </div>
                    <UserIcon className="w-4 h-4 text-purple shrink-0" />
                  </Link>

                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[12px] font-bold">
                    <Link
                      href="/profile?tab=posts"
                      onClick={() => setOpen(false)}
                      className="chip justify-center bg-card hover:bg-purple hover:text-white py-1.5"
                    >
                      📝 Your Posts
                    </Link>
                    <Link
                      href="/profile?tab=saved"
                      onClick={() => setOpen(false)}
                      className="chip justify-center bg-card hover:bg-purple hover:text-white py-1.5"
                    >
                      ★ Saved Articles
                    </Link>
                  </div>
                </div>
              )}

              {links.map((l) => {
                const Icon = l.icon;
                const isActive = pathname === l.href;
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold transition-all ${
                      isActive
                        ? "bg-purple text-white shadow-pop-sm"
                        : "bg-bg text-ink border border-ink/15 hover:border-purple"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-purple"}`} />
                    {l.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-dashed border-ink/20" />

              <div className="flex gap-2.5 pt-1">
                <Link
                  href="/write"
                  onClick={() => setOpen(false)}
                  className="btn btn-purple flex-1 py-3 font-bold flex items-center justify-center gap-2 shadow-pop"
                >
                  <PenTool className="w-4 h-4" />
                  Write ✦
                </Link>

                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border-rose-500/30 flex-1 py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="btn btn-lime flex-1 py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}