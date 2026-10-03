"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HackerPassport } from "@/components/HackerPassport";
import { getMyPassport, getActiveTicketNumber, saveMyPassport } from "@/lib/passport-storage";
import type { HackathonParticipant, HackathonTheme } from "@/lib/hackathons";
import { Sparkles, ArrowRight, ShieldCheck, Loader2, RefreshCw } from "lucide-react";

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
  const [isRefreshingRoster, setIsRefreshingRoster] = useState(false);

  useEffect(() => {
    // Use the actual hackathonId so keys are consistent across the app
    const hackId = serverParticipant.hackathonId || "gh-shipathon-2026";
    const activeEmail = (localStorage.getItem("gh_active_email") || "").trim().toLowerCase();
    const myPassport = getMyPassport(hackId, activeEmail || undefined);

    // Strict ownership verification:
    // 1. myPassport exists and matches the exact ticket ID
    // 2. The ticket's registered email matches the logged-in active email
    const isExactMatch =
      !!myPassport &&
      myPassport.ticketNumber.toUpperCase() === ticketId.toUpperCase() &&
      (!serverParticipant.email ||
        !myPassport.email ||
        myPassport.email.trim().toLowerCase() === serverParticipant.email.trim().toLowerCase());

    if (isExactMatch) {
      setIsOwner(true);

      const merged: HackathonParticipant = {
        ...serverParticipant,
        name: myPassport?.name || serverParticipant.name || "",
        email: myPassport?.email || serverParticipant.email || "",
        roleTitle: myPassport?.roleTitle || serverParticipant.roleTitle || "Fullstack & AI Engineer",
        bio: myPassport?.bio || serverParticipant.bio,
        discordHandle: myPassport?.discordHandle || serverParticipant.discordHandle,
        twitterHandle: myPassport?.twitterHandle || serverParticipant.twitterHandle,
        avatarUrl: myPassport?.avatarUrl || serverParticipant.avatarUrl,
        // Cleanly prioritize theme and squad data
        themeStyle: myPassport?.themeStyle || serverParticipant.themeStyle || "lime",
        teamName: serverParticipant.teamName || myPassport?.teamName,
        teamCode: serverParticipant.teamCode || myPassport?.teamCode,
        isCaptain: serverParticipant.isCaptain ?? myPassport?.isCaptain ?? false,
        teammates:
          (serverParticipant.teammates && serverParticipant.teammates.length > 0)
            ? serverParticipant.teammates
            : myPassport?.teammates,
        submission: serverParticipant.submission || myPassport?.submission,
      };

      setParticipant(merged);
      // Persist the freshest state back into localStorage so cache never retains stale state
      saveMyPassport(merged);

      // ALWAYS sync full participant details (name, roleTitle, team, theme) to server disk & DB
      // so that ANY visitor scanning the QR or opening the shared link sees the exact real details
      if (merged.name && merged.ticketNumber) {
        fetch(`/api/hackathons/${slug}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participant: merged }),
        }).catch(() => {});
      }
    } else {
      setIsOwner(false);
      setParticipant(serverParticipant);
    }
    setResolved(true);
  }, [ticketId, serverParticipant, slug]);


  // Refresh active team squad roster directly from server
  const handleRefreshRoster = async () => {
    if (!participant.teamCode) return;
    setIsRefreshingRoster(true);
    try {
      const res = await fetch(`/api/hackathons/${slug}/team?code=${participant.teamCode}`);
      const data = await res.json();
      if (data?.team?.members) {
        const squadRoster = data.team.members.map((m: any) => ({
          name: m.name,
          roleTitle: m.roleTitle,
          avatarUrl: m.avatarUrl,
        }));
        setParticipant((prev) => {
          const updated = {
            ...prev,
            teamName: data.team.name,
            teammates: squadRoster,
          };
          saveMyPassport(updated);
          return updated;
        });
      }
    } catch (e) {
      console.warn("Could not refresh roster:", e);
    } finally {
      setIsRefreshingRoster(false);
    }
  };

  const handleThemeChange = useCallback(
    (t: HackathonTheme) => {
      setParticipant((prev) => {
        const updated = { ...prev, themeStyle: t };
        const hackId = prev.hackathonId || "gh-shipathon-2026";
        const myPassport = getMyPassport(hackId);
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

  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [newTeamNameInput, setNewTeamNameInput] = useState("");
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopySquadLink = () => {
    if (!participant.teamCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://gohackerz.com";
    const url = `${origin}/hackathons/${slug}/register?team=${participant.teamCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim()) return;
    setTeamLoading(true);
    setTeamMsg(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          ticketNumber: participant.ticketNumber,
          teamCode: teamCodeInput.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to join team.");
      }
      setParticipant(data.participant);
      saveMyPassport(data.participant);
      setTeamMsg({ type: "success", text: data.message || "Successfully joined squad!" });
      setTeamCodeInput("");
    } catch (err: any) {
      setTeamMsg({ type: "error", text: err.message || "Could not join team." });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamNameInput.trim()) return;
    setTeamLoading(true);
    setTeamMsg(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ticketNumber: participant.ticketNumber,
          teamName: newTeamNameInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to create team.");
      }
      setParticipant(data.participant);
      saveMyPassport(data.participant);
      setTeamMsg({ type: "success", text: data.message || "Squad created!" });
      setNewTeamNameInput("");
    } catch (err: any) {
      setTeamMsg({ type: "error", text: err.message || "Could not create team." });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!window.confirm("Are you sure you want to leave this squad and hack Solo?")) return;
    setTeamLoading(true);
    setTeamMsg(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          ticketNumber: participant.ticketNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to leave team.");
      }
      setParticipant(data.participant);
      saveMyPassport(data.participant);
      setTeamMsg({ type: "success", text: "You have left the squad and are now hacking Solo." });
    } catch (err: any) {
      setTeamMsg({ type: "error", text: err.message || "Could not leave squad." });
    } finally {
      setTeamLoading(false);
    }
  };

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
              Authenticated boarding pass for{" "}
              <strong className="text-ink">{participant.name || "Verified Builder"}</strong>. Inspect flight credentials, scan gate QR code, or download your official boarding pass.
            </>
          )}
        </p>
      </div>

      {/* 3D Interactive Holographic Passport */}
      <HackerPassport
        participant={participant}
        hackathonTitle={hackathonTitle}
        isOwner={isOwner}
        slug={slug}
        ticketId={ticketId}
        onThemeChange={handleThemeChange}
      />

      {/* Interactive Squad Alliance Management (Owner Only) */}
      {isOwner && (
        <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-6 max-w-[620px] mx-auto">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple" />
              <h3 className="font-mono text-sm font-black text-ink uppercase tracking-wider">
                {participant.teamCode ? "SQUAD ALLIANCE ROSTER" : "SQUAD FORMATION"}
              </h3>
            </div>
            {participant.teamCode ? (
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-brand-dark text-lime">
                {participant.isCaptain ? "★ SQUAD CAPTAIN" : "● SQUAD MEMBER"}
              </span>
            ) : (
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-muted/20 text-muted">
                SOLO BUILDER
              </span>
            )}
          </div>

          {teamMsg && (
            <div
              className={`p-3.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 ${
                teamMsg.type === "success"
                  ? "bg-lime/15 border-lime text-brand-dark"
                  : "bg-pink/15 border-pink text-pink"
              }`}
            >
              <span>{teamMsg.type === "success" ? "✓" : "⚠"}</span>
              <span>{teamMsg.text}</span>
            </div>
          )}

          {participant.teamCode ? (
            /* Squad Active View */
            <div className="space-y-4">
              <div className="bg-bg border-2 border-ink/15 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-muted block uppercase">
                      TEAM NAME
                    </span>
                    <span className="font-bold text-lg text-ink">
                      {participant.teamName || "Team"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-muted block uppercase">
                      INVITE CODE
                    </span>
                    <span className="font-mono font-black text-sm text-purple bg-purple/10 px-2 py-0.5 rounded border border-purple/30">
                      {participant.teamCode}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted">
                    Squad Size: {participant.teammates?.length || 1} / 4 builders
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySquadLink}
                    className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedInvite ? "✓ INVITE LINK COPIED!" : "COPY SQUAD INVITE LINK"}
                  </button>
                </div>
              </div>

              {/* Teammates List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-muted block uppercase">
                    ACTIVE BUILDERS IN THIS SQUAD:
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshRoster}
                    disabled={isRefreshingRoster}
                    className="font-mono text-[11px] text-purple hover:text-purple/80 flex items-center gap-1 font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingRoster ? "animate-spin" : ""}`} />
                    {isRefreshingRoster ? "Refreshing…" : "Refresh Roster"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(participant.teammates || [{ name: participant.name, roleTitle: participant.roleTitle }]).map(
                    (member, idx) => (
                      <div
                        key={idx}
                        className="bg-bg border border-ink/15 rounded-xl p-3 flex items-center gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple/20 text-purple font-mono font-bold flex items-center justify-center text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-xs text-ink truncate">
                            {member.name}
                          </div>
                          <div className="font-mono text-[11px] text-muted truncate">
                            {member.roleTitle}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Leave Squad Option */}
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={handleLeaveSquad}
                  disabled={teamLoading}
                  className="font-mono text-xs text-pink hover:underline"
                >
                  Leave Squad and Return to Solo →
                </button>
              </div>
            </div>
          ) : (
            /* Solo Builder - Join or Create Squad */
            <div className="space-y-4">
              <p className="text-xs text-body leading-relaxed">
                You are currently registered as a <strong>Solo Competitor</strong>. You can join an existing squad using their invite code or found your own team anytime!
              </p>

              {/* Tabs */}
              <div className="flex rounded-xl bg-bg border border-ink/15 p-1 gap-1 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("join")}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    activeTab === "join"
                      ? "bg-purple text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  JOIN WITH CODE
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    activeTab === "create"
                      ? "bg-purple text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  CREATE NEW SQUAD
                </button>
              </div>

              {activeTab === "join" ? (
                <form onSubmit={handleJoinSquad} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs font-bold text-ink block">
                      ENTER SQUAD INVITE CODE
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VOID-42 or FORGE-99"
                      value={teamCodeInput}
                      onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-mono text-sm text-ink uppercase tracking-wider outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading || !teamCodeInput.trim()}
                    className="w-full btn btn-sm btn-purple font-mono text-xs font-bold py-2.5 rounded-xl shadow-pop-sm"
                  >
                    {teamLoading ? "JOINING SQUAD..." : "JOIN SQUAD NOW →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateSquad} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs font-bold text-ink block">
                      SQUAD / TEAM NAME
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CyberPunks, ZeroDay Swarm"
                      value={newTeamNameInput}
                      onChange={(e) => setNewTeamNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading || !newTeamNameInput.trim()}
                    className="w-full btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold py-2.5 rounded-xl shadow-pop-sm"
                  >
                    {teamLoading ? "CREATING SQUAD..." : "FOUND SQUAD & GET INVITE CODE →"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

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
