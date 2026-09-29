"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HackerPassport } from "@/components/HackerPassport";
import { getMyPassport, getActiveTicketNumber, saveMyPassport } from "@/lib/passport-storage";
import type { HackathonParticipant, HackathonTheme } from "@/lib/hackathons";
import { Sparkles, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

interface PassPortPageClientProps {
  serverParticipant: HackathonParticipant;
  hackathonTitle: string;
  slug: string;
  ticketId: string;
}

export function PassPortPageClient({
  serverParticipant,
  hackathonTitle,
  slug,
  ticketId,
}: PassPortPageClientProps) {
  const [participant, setParticipant] = useState<HackathonParticipant>(serverParticipant);
  const [isOwner, setIsOwner] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // Priority 1: If this is MY ticket, use data from localStorage (has real name + all details)
    const myPassport = getMyPassport("gh-shipathon-2026");
    const activeTicket = getActiveTicketNumber();

    if (
      myPassport &&
      myPassport.ticketNumber.toUpperCase() === ticketId.toUpperCase()
    ) {
      const merged: HackathonParticipant = {
        ...serverParticipant,
        name: myPassport.name || serverParticipant.name,
        email: myPassport.email || serverParticipant.email,
        roleTitle: myPassport.roleTitle || serverParticipant.roleTitle,
        bio: myPassport.bio || serverParticipant.bio,
        discordHandle: myPassport.discordHandle || serverParticipant.discordHandle,
        twitterHandle: myPassport.twitterHandle || serverParticipant.twitterHandle,
        avatarUrl: myPassport.avatarUrl || serverParticipant.avatarUrl,
        themeStyle: myPassport.themeStyle || serverParticipant.themeStyle,
        isCaptain: myPassport.isCaptain ?? serverParticipant.isCaptain,
        teamName: myPassport.teamName || serverParticipant.teamName,
        teamCode: myPassport.teamCode || serverParticipant.teamCode,
        teammates: myPassport.teammates || serverParticipant.teammates,
        submission: myPassport.submission || serverParticipant.submission,
      };
      setParticipant(merged);
      setIsOwner(true);

      // Auto-sync to server disk so other devices scanning QR code get full details!
      fetch(`/api/hackathons/${slug}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: merged }),
      }).catch(() => {});
    } else if (activeTicket && activeTicket.toUpperCase() === ticketId.toUpperCase()) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    setResolved(true);
  }, [ticketId, serverParticipant, slug]);

  const handleThemeChange = useCallback(
    (t: HackathonTheme) => {
      setParticipant((prev) => {
        const updated = { ...prev, themeStyle: t };
        const myPassport = getMyPassport("gh-shipathon-2026");
        if (myPassport && myPassport.ticketNumber.toUpperCase() === ticketId.toUpperCase()) {
          saveMyPassport({ ...myPassport, themeStyle: t });
          fetch(`/api/hackathons/${slug}/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participant: updated }),
          }).catch(() => {});
        }
        return updated;
      });
    },
    [ticketId, slug]
  );

  const isLoading = !participant.name && !resolved;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="font-mono text-xs text-purple font-extrabold uppercase tracking-widest block">
          GOHACKERZ ARENA // TICKET VERIFICATION
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
          Official Hacker Passport
        </h1>
        <p className="text-sm sm:text-base text-body">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2 text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading credential details…
            </span>
          ) : (
            <>
              Authenticated credential for{" "}
              <strong className="text-ink">{participant.name || "Verified Builder"}</strong>. Tilt the
              pass in 3D, flip to view the mission dossier, or scan the QR code.
            </>
          )}
        </p>
      </div>

      {/* 3D Interactive Holographic Passport */}
      <HackerPassport
        participant={participant}
        hackathonTitle={hackathonTitle}
        isOwner={isOwner}
        onThemeChange={handleThemeChange}
      />

      {/* Project Submission Highlight */}
      {participant.submission && (
        <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-4 max-w-[620px] mx-auto">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <span className="font-mono text-xs font-black text-lime bg-brand-dark px-2.5 py-1 rounded">
              🚀 PROJECT SUBMISSION
            </span>
            <span className="font-mono text-xs text-muted">
              {new Date(participant.submission.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-ink">
              {participant.submission.title}
            </h3>
            <p className="text-sm text-body mt-1">{participant.submission.tagline}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {participant.submission.demoUrl && (
              <a
                href={participant.submission.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold"
              >
                LIVE DEMO ↗
              </a>
            )}
            {participant.submission.repoUrl && (
              <a
                href={participant.submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-card border border-ink text-ink font-mono text-xs font-bold"
              >
                GITHUB REPO ↗
              </a>
            )}
            {participant.submission.gammaUrl && (
              <a
                href={participant.submission.gammaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-purple/15 text-purple border border-purple/30 font-mono text-xs font-bold"
              >
                GAMMA PITCH DECK ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Option A Viral Banner for Visitors / Scanners */}
      <div className="bg-brand-dark text-white rounded-3xl p-8 sm:p-10 border-2 border-ink shadow-pop-xl text-center space-y-4 max-w-[620px] mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> BUILD WITH GOHACKERZ
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isOwner
            ? "Share your Hacker Passport on socials! 🚀"
            : "Want to compete or challenge this team?"}
        </h3>

        <p className="text-sm text-[#D4CEF5] leading-relaxed max-w-md mx-auto">
          {isOwner
            ? "Download your high-res PNG pass, copy the link, and flex your builder credentials on X, LinkedIn, or Discord."
            : "Join the Global Shipathon 2026. Register in 60 seconds, get your own holographic animated passport, and compete for grand cash grants, cloud credits, and prestige."}
        </p>

        {!isOwner && (
          <div className="pt-2">
            <Link
              href={`/hackathons/${slug}/register`}
              className="btn btn-lime text-brand-dark font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-pop inline-flex items-center gap-2"
            >
              <span>CLAIM YOUR OWN HACKER PASSPORT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
