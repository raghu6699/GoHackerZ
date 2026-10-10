"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Sparkles,
  ArrowRight,
  Flame,
  Calendar,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { HackathonData } from "@/lib/hackathons";

interface HackathonsDirectoryProps {
  hackathons: HackathonData[];
}

export function HackathonsDirectory({ hackathons }: HackathonsDirectoryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "concluded">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCount = hackathons.filter((h) => h.status === "ACTIVE" || h.status === "UPCOMING").length;
  const concludedCount = hackathons.filter((h) => h.status === "COMPLETED" || h.status === "JUDGING").length;

  const filteredHackathons = hackathons.filter((h) => {
    // Tab filter
    if (activeTab === "active" && h.status !== "ACTIVE" && h.status !== "UPCOMING") return false;
    if (activeTab === "concluded" && h.status !== "COMPLETED" && h.status !== "JUDGING") return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = h.title.toLowerCase().includes(q);
    const taglineMatch = h.tagline.toLowerCase().includes(q);
    const trackMatch = h.tracks.some((t) => t.title.toLowerCase().includes(q) || t.tags?.some((tag) => tag.toLowerCase().includes(q)));
    const sponsorMatch = h.sponsors?.some((s) => s.name.toLowerCase().includes(q));

    return titleMatch || taglineMatch || trackMatch || sponsorMatch;
  });

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-[#141030] border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-[#C6FF3D] text-[#0A071B] shadow-sm font-extrabold"
                : "text-[#a59fcf] hover:text-white"
            }`}
          >
            All Arenas ({hackathons.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-[#C6FF3D] text-[#0A071B] shadow-sm font-extrabold"
                : "text-[#a59fcf] hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Now ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("concluded")}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === "concluded"
                ? "bg-[#C6FF3D] text-[#0A071B] shadow-sm font-extrabold"
                : "text-[#a59fcf] hover:text-white"
            }`}
          >
            Concluded / Past ({concludedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#8e88b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hackathons, tracks, sponsors..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141030] border border-white/10 text-white placeholder-[#8e88b8] text-xs font-mono focus:outline-none focus:border-[#C6FF3D] transition-colors"
          />
        </div>
      </div>

      {/* Hackathons Grid */}
      {filteredHackathons.length === 0 ? (
        <div className="bg-[#141030] border border-white/10 rounded-2xl p-10 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="font-bold text-white text-base">No hackathons found</h3>
          <p className="text-xs text-[#a59fcf] max-w-sm mx-auto">
            No active hackathons matched your search filters. Try a different query or clear the filter.
          </p>
          <button
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHackathons.map((h) => {
            const isLive = h.status === "ACTIVE";
            const isCompleted = h.status === "COMPLETED";
            const isJudging = h.status === "JUDGING";
            const hostSponsor = h.sponsors?.[0]?.name || (h.slug === "shipathon-2026" ? "GoHackerz" : "Partner Host");

            return (
              <div
                key={h.id || h.slug}
                className="group relative bg-[#0D0924] border-2 border-white/10 hover:border-[#C6FF3D] rounded-3xl p-6 sm:p-7 transition-all duration-300 shadow-pop flex flex-col justify-between"
              >
                {/* Top Badges */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#C6FF3D] font-mono text-[11px] font-bold">
                        ⚡ {hostSponsor}
                      </span>
                      {h.slug === "shipathon-2026" && (
                        <span className="px-2 py-0.5 rounded-md bg-[#8A2BE2]/20 border border-[#8A2BE2]/40 text-[#c899ff] font-mono text-[10px] font-bold">
                          FLAGSHIP
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 font-mono text-[11px] font-extrabold rounded-lg shadow-sm inline-flex items-center gap-1 ${
                        isLive
                          ? "bg-[#C6FF3D] text-[#0A071B]"
                          : isJudging
                          ? "bg-amber-400 text-black"
                          : isCompleted
                          ? "bg-[#8A2BE2] text-white"
                          : "bg-blue-400 text-black"
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                      {isLive ? "● LIVE NOW" : isJudging ? "⚖️ JUDGING" : isCompleted ? "🏆 COMPLETED" : "UPCOMING"}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <Link
                      href={`/hackathons/${h.slug}`}
                      className="text-xl sm:text-2xl font-extrabold text-white tracking-tight group-hover:text-[#C6FF3D] transition-colors block"
                    >
                      {h.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-[#a59fcf] mt-2 line-clamp-2 leading-relaxed">
                      {h.tagline}
                    </p>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#141030] border border-white/5">
                    <div>
                      <span className="text-[10px] font-mono text-[#8e88b8] uppercase block">Prize Pool</span>
                      <span className="text-xs sm:text-sm font-mono font-black text-[#C6FF3D]">
                        {h.prizePool || "$10,000 Grants"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8e88b8] uppercase block">Community</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#8e88b8]" />
                        {h.participantCount ? `${h.participantCount}+ Builders` : "Open to All"}
                      </span>
                    </div>
                  </div>

                  {/* Tracks Pills */}
                  {h.tracks && h.tracks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-[#8e88b8] uppercase tracking-wider block">
                        Featured Tracks:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {h.tracks.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#ded8ff]"
                          >
                            {t.title}
                          </span>
                        ))}
                        {h.tracks.length > 3 && (
                          <span className="px-2 py-1 rounded-lg bg-white/5 text-[11px] font-mono text-[#8e88b8]">
                            +{h.tracks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/hackathons/${h.slug}`}
                    className="text-xs font-mono font-bold text-[#C6FF3D] hover:underline inline-flex items-center gap-1"
                  >
                    Arena Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <>
                        <Link
                          href={`/hackathons/${h.slug}/register`}
                          className="px-3 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b5f028] text-[#0A071B] font-mono text-xs font-black transition-all shadow-sm"
                        >
                          Register 🎫
                        </Link>
                        <Link
                          href={`/hackathons/${h.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors"
                        >
                          Enter 🚀
                        </Link>
                      </>
                    ) : isCompleted ? (
                      <>
                        <Link
                          href={`/hackathons/${h.slug}/submissions`}
                          className="px-3 py-1.5 rounded-xl bg-[#8A2BE2] hover:bg-[#7823c7] text-white font-mono text-xs font-bold transition-all shadow-sm"
                        >
                          Showcase 🏆
                        </Link>
                        <Link
                          href={`/hackathons/${h.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors"
                        >
                          Results 📜
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/hackathons/${h.slug}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b5f028] text-[#0A071B] font-mono text-xs font-black transition-all shadow-sm"
                      >
                        Explore Event ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
