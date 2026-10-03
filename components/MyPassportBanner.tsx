"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getMyPassport, getActiveTicketNumber } from "@/lib/passport-storage";
import { createClient } from "@/lib/supabase-browser";
import type { HackathonParticipant } from "@/lib/hackathons";
import { Ticket } from "lucide-react";

interface MyPassportBannerProps {
  slug?: string;
  hackathonId?: string;
  className?: string;
}

export function MyPassportBanner({
  slug = "shipathon-2026",
  hackathonId = "gh-shipathon-2026",
  className = "",
}: MyPassportBannerProps) {
  const [passport, setPassport] = useState<HackathonParticipant | null>(null);
  const [ticketNum, setTicketNum] = useState<string | null>(null);

  useEffect(() => {
    // Only show the banner when the user is actually authenticated so that
    // a signed-out visitor doesn't see stale data from a previous session.
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        // Not logged in — don't show any passport banner
        return;
      }

      const saved = getMyPassport(hackathonId);
      const activeCode = getActiveTicketNumber();

      if (saved) {
        // Make sure this passport belongs to the current logged-in user
        const currentEmail = session.user.email?.trim().toLowerCase();
        if (currentEmail && saved.email && saved.email.trim().toLowerCase() !== currentEmail) {
          // Stale passport from a different account — ignore it
          return;
        }
        setPassport(saved);
        setTicketNum(saved.ticketNumber);
      } else if (activeCode) {
        setTicketNum(activeCode);
      }
    });
  }, [hackathonId]);

  if (!ticketNum) return null;

  return (
    <div
      className={`w-full bg-gradient-to-r from-brand-dark via-[#211847] to-brand-dark text-white border-2 border-lime shadow-pop-lg rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 anim-pop ${className}`}
    >
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="w-10 h-10 rounded-xl bg-lime/20 border border-lime flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5 text-lime" />
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-mono text-[10px] bg-lime text-brand-dark font-black px-2 py-0.5 rounded uppercase">
              REGISTERED HACKER
            </span>
            <span className="font-mono text-xs font-bold text-white/70">
              TICKET #{ticketNum}
            </span>
          </div>
          <h4 className="font-bold text-sm sm:text-base text-white mt-0.5">
            {passport?.name
              ? `${passport.name} · ${passport.teamName || "Solo Shipper"}`
              : "Your Hacker Passport is Active & Verified"}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href={`/hackathons/${slug}/pass/${ticketNum}`}
          className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:scale-105 transition-all"
        >
          VIEW MY PASSPORT 🎫
        </Link>
        <Link
          href={`/hackathons/${slug}/submit?ticket=${ticketNum}`}
          className="btn btn-sm bg-purple text-white hover:bg-purple-dark font-mono text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 transition-all"
        >
          SUBMIT PROJECT 🚀
        </Link>
      </div>
    </div>
  );
}
