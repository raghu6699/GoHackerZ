"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getMyPassport, getActiveTicketNumber, cleanHackathonId } from "@/lib/passport-storage";
import { createClient } from "@/lib/supabase-browser";
import type { HackathonParticipant } from "@/lib/hackathons";
import { Ticket, CheckCircle2 } from "lucide-react";

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
      const currentEmail = session?.user?.email?.trim().toLowerCase();
      if (!currentEmail) {
        setPassport(null);
        setTicketNum(null);
        return;
      }

      const targetHackId = hackathonId || slug;
      const cleanTarget = cleanHackathonId(targetHackId);
      const saved = cleanTarget ? getMyPassport(cleanTarget, currentEmail) : null;

      if (
        saved &&
        cleanHackathonId(saved.hackathonId) === cleanTarget &&
        saved.email &&
        saved.email.trim().toLowerCase() === currentEmail
      ) {
        setPassport(saved);
        setTicketNum(saved.ticketNumber);

        // Check server sync in background for latest submission
        fetch(`/api/hackathons/${slug}/pass/${saved.ticketNumber}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.participant) {
              setPassport(d.participant);
              setTicketNum(d.participant.ticketNumber);
            } else if (d.differentHackathon || !d.success) {
              setPassport(null);
              setTicketNum(null);
            }
          })
          .catch(() => {});
      } else {
        setPassport(null);
        setTicketNum(null);
      }
    });
  }, [hackathonId, slug]);

  if (!ticketNum || !passport) return null;

  const hasSubmission = !!passport.submission;

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
            {hasSubmission && (
              <span className="font-mono text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PROJECT SUBMITTED
              </span>
            )}
          </div>
          <h4 className="font-bold text-sm sm:text-base text-white mt-0.5">
            {passport?.name
              ? `${passport.name} · ${passport.teamName || "Solo Shipper"}`
              : "Your Hacker Passport is Active & Verified"}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
        <Link
          href={`/hackathons/${slug}/pass/${ticketNum}`}
          className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm hover:scale-105 transition-all"
        >
          VIEW MY PASSPORT 🎫
        </Link>
        {hasSubmission ? (
          <Link
            href={`/hackathons/${slug}/submit?ticket=${ticketNum}`}
            className="btn btn-sm bg-[#161233] text-[#C6FF3D] hover:bg-[#201b47] font-mono text-xs font-bold px-3.5 py-2 rounded-xl border border-[#7C5CFF]/40 transition-all flex items-center gap-1"
          >
            <span>EDIT SUBMISSION</span>
            <span className="text-[10px]">✎</span>
          </Link>
        ) : (
          <Link
            href={`/hackathons/${slug}/submit?ticket=${ticketNum}`}
            className="btn btn-sm bg-purple text-white hover:bg-purple-dark font-mono text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 transition-all"
          >
            SUBMIT PROJECT 🚀
          </Link>
        )}
      </div>
    </div>
  );
}
