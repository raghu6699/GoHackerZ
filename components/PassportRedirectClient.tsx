"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllMyPassports, cleanHackathonId } from "@/lib/passport-storage";
import { Loader2, Ticket, Sparkles, ArrowRight, Layers } from "lucide-react";

interface PassportRedirectClientProps {
  userEmail: string;
}

export function PassportRedirectClient({ userEmail }: PassportRedirectClientProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [passports, setPassports] = useState<any[]>([]);

  useEffect(() => {
    // 1. Check local storage for any minted passports
    const localList = getAllMyPassports(userEmail);
    if (localList.length > 0) {
      setPassports(localList);
      // If 1 passport, redirect immediately
      if (localList.length === 1) {
        const p = localList[0];
        const slug = cleanHackathonId(p.hackathonId) || "shipathon-2026";
        router.replace(`/hackathons/${slug}/pass/${p.ticketNumber}`);
        return;
      }
      setChecking(false);
      return;
    }

    // 2. Fetch from server API
    fetch(`/api/hackathons/my-passports`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.passports && data.passports.length > 0) {
          setPassports(data.passports);
          if (data.passports.length === 1) {
            const p = data.passports[0];
            const slug = cleanHackathonId(p.hackathonId) || "shipathon-2026";
            router.replace(`/hackathons/${slug}/pass/${p.ticketNumber}`);
            return;
          }
        }
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, [userEmail, router]);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple" />
        <p className="font-mono text-xs font-bold text-muted uppercase tracking-widest">
          Resolving Verified Hacker Passport...
        </p>
      </div>
    );
  }

  // If user has multiple passports, show the Passport Portfolio Hub
  if (passports.length > 0) {
    return (
      <div className="min-h-screen py-10">
        <div className="wrap max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-black">
              <Ticket className="w-3.5 h-3.5" /> YOUR PASSPORT PORTFOLIO
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Select Your Event Passport
            </h1>
            <p className="text-sm text-muted">
              You are registered across {passports.length} GoHackerz engineering hackathons.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {passports.map((p) => {
              const slug = cleanHackathonId(p.hackathonId) || "shipathon-2026";
              const title = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              return (
                <Link
                  key={p.ticketNumber}
                  href={`/hackathons/${slug}/pass/${p.ticketNumber}`}
                  className="rounded-2xl border-2 border-ink bg-card p-5 shadow-pop hover:shadow-pop-lg transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-purple font-bold uppercase tracking-wider block">
                        TICKET #{p.ticketNumber}
                      </span>
                      <h3 className="text-lg font-bold text-ink mt-1 group-hover:text-purple transition-colors">
                        {title}
                      </h3>
                    </div>
                    <span className="w-8 h-8 rounded-lg bg-lime text-brand-dark flex items-center justify-center font-bold text-sm">
                      🎫
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-muted border-t border-ink/10 pt-3">
                    <span>{p.roleTitle || "Fullstack Engineer"}</span>
                    <span className="text-purple font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Pass →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <Link href="/hackathons" className="btn btn-ghost font-mono text-xs">
              ← Browse All Hackathons in Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If no passports found
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center py-12">
      <div className="wrap max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple/10 border-2 border-purple/30 text-purple flex items-center justify-center text-3xl mx-auto shadow-pop">
          🎫
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            No Hacker Passports Found
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            You haven&apos;t minted a 3D Holographic Passport for any active hackathon yet. Join an active event in the GoHackerz Arena to build, compete, and claim your verified credentials.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/hackathons" className="btn btn-purple btn-md font-mono font-bold text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Explore Active Hackathons</span>
          </Link>
          <Link href="/profile?tab=passports" className="btn btn-ghost btn-md font-mono font-bold text-xs">
            <span>Profile Vault</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
