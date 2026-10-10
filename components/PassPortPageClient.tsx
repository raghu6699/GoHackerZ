"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { HackerPassport } from "@/components/HackerPassport";
import { getMyPassport, getActiveTicketNumber, saveMyPassport } from "@/lib/passport-storage";
import type { HackathonParticipant, HackathonTheme, HackathonCertificate } from "@/lib/hackathons";
import { Sparkles, ArrowRight, ShieldCheck, Loader2, RefreshCw, Trophy, Award, Printer, ExternalLink, CheckCircle, Code2 } from "lucide-react";

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
  const [certificate, setCertificate] = useState<HackathonCertificate | null>(
    serverParticipant.certificate || null
  );

  useEffect(() => {
    if (ticketId) {
      fetch(`/api/certificates/${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.certificate) {
            setCertificate(data.certificate);
          }
        })
        .catch(() => {});
    }
  }, [ticketId]);

  // Live query submission for this ticket
  useEffect(() => {
    if (ticketId && slug) {
      fetch(`/api/hackathons/${slug}/submit?ticket=${ticketId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.submission) {
            setParticipant((prev) => {
              const updated = { ...prev, submission: data.submission };
              saveMyPassport(updated);
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, [ticketId, slug]);

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
        // Cleanly prioritize theme and squad data from localStorage
        themeStyle: myPassport?.themeStyle || serverParticipant.themeStyle || "lime",
        teamName: myPassport?.teamName || serverParticipant.teamName || undefined,
        teamCode: myPassport?.teamCode || serverParticipant.teamCode || undefined,
        isCaptain: myPassport?.isCaptain ?? serverParticipant.isCaptain ?? false,
        teammates:
          (myPassport?.teammates && myPassport.teammates.length > 0)
            ? myPassport.teammates
            : (serverParticipant.teammates && serverParticipant.teammates.length > 0)
            ? serverParticipant.teammates
            : undefined,
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
            teamName: data.team.name || prev.teamName,
            teamCode: data.team.inviteCode || prev.teamCode,
            teammates: squadRoster,
            isCaptain: prev.isCaptain,
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

  // Auto-refresh squad roster on mount if user is part of a squad
  useEffect(() => {
    if (!participant.teamCode) return;
    fetch(`/api/hackathons/${slug}/team?code=${participant.teamCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.team?.members) {
          const squadRoster = data.team.members.map((m: any) => ({
            name: m.name,
            roleTitle: m.roleTitle,
            avatarUrl: m.avatarUrl,
          }));
          setParticipant((prev) => {
            if (!prev.teamCode) return prev;
            const updated = {
              ...prev,
              teamName: data.team.name || prev.teamName,
              teamCode: data.team.inviteCode || prev.teamCode,
              teammates: squadRoster,
              isCaptain: prev.isCaptain,
            };
            saveMyPassport(updated);
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [participant.teamCode, slug]);

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

  const searchParams = useSearchParams();
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [newTeamNameInput, setNewTeamNameInput] = useState("");
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [urlInviteTeam, setUrlInviteTeam] = useState<{ code: string; name: string; count: number } | null>(null);

  // Check URL query parameters for team invite code
  useEffect(() => {
    const invite =
      searchParams?.get("team") ||
      searchParams?.get("join") ||
      searchParams?.get("invite") ||
      searchParams?.get("code");

    if (invite) {
      const clean = invite.trim().toUpperCase();
      setTeamCodeInput(clean);
      fetch(`/api/hackathons/${slug}/team?code=${clean}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.team) {
            setUrlInviteTeam({
              code: clean,
              name: data.team.name,
              count: data.team.membersCount,
            });
          }
        })
        .catch(() => {});
    }
  }, [searchParams, slug]);

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

  const handleJoinSquadDirect = async (codeToJoin: string) => {
    if (!codeToJoin.trim()) return;
    setTeamLoading(true);
    setTeamMsg(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          ticketNumber: participant.ticketNumber,
          teamCode: codeToJoin.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to join team.");
      }
      setParticipant(data.participant);
      saveMyPassport(data.participant);
      setTeamMsg({ type: "success", text: data.message || `Successfully joined ${data.team?.name || codeToJoin}!` });
      setTeamCodeInput("");
      setUrlInviteTeam(null);
      // Synchronize to server immediately
      fetch(`/api/hackathons/${slug}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: data.participant }),
      }).catch(() => {});
    } catch (err: any) {
      setTeamMsg({ type: "error", text: err.message || "Could not join team." });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim()) return;
    await handleJoinSquadDirect(teamCodeInput);
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

      // Synchronize to server immediately
      fetch(`/api/hackathons/${slug}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: data.participant }),
      }).catch(() => {});
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

      {/* Official Verifiable Certificate & Trophy Vault Section */}
      <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-5 max-w-[620px] mx-auto">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple" />
            <h3 className="font-mono text-sm font-black text-ink uppercase tracking-wider">
              OFFICIAL HACKER CREDENTIAL & VISA
            </h3>
          </div>
          {certificate ? (
            <span
              className={`font-mono text-xs font-black px-2.5 py-1 rounded flex items-center gap-1 ${
                certificate.type === "WINNER_FIRST"
                  ? "bg-amber-400 text-black shadow-sm"
                  : certificate.type.startsWith("WINNER")
                  ? "bg-purple text-white shadow-sm"
                  : "bg-brand-dark text-lime"
              }`}
            >
              {certificate.type === "WINNER_FIRST" ? (
                <>
                  <Trophy className="w-3.5 h-3.5" /> 1ST PLACE WINNER
                </>
              ) : certificate.type === "WINNER_SECOND" ? (
                <>
                  <Trophy className="w-3.5 h-3.5" /> 2ND PLACE
                </>
              ) : certificate.type === "WINNER_THIRD" ? (
                <>
                  <Trophy className="w-3.5 h-3.5" /> 3RD PLACE
                </>
              ) : certificate.type === "TRACK_WINNER" ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> TRACK CHAMPION
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-lime" /> VERIFIED PARTICIPANT
                </>
              )}
            </span>
          ) : participant.submission ? (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-brand-dark text-lime flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-lime" /> SUBMISSION VERIFIED · PENDING JUDGING
            </span>
          ) : (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              SUBMISSION REQUIRED
            </span>
          )}
        </div>

        {certificate ? (
          <div className="space-y-4">
            <div className="bg-bg border-2 border-ink/15 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                  AWARD DISTINCTION
                </span>
                <h4 className="font-bold text-base sm:text-lg text-ink mt-0.5">
                  {certificate.awardTitle}
                </h4>
                <p className="text-xs text-body mt-1">
                  Issued to <strong>{certificate.recipientName}</strong> for active participation in{" "}
                  <strong>{certificate.title}</strong>.
                </p>
                <div className="mt-2 font-mono text-[11px] text-purple flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Credential ID: <strong>{certificate.certNumber}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/verify/${certificate.certNumber}`}
                className="btn btn-sm btn-purple font-mono text-xs font-bold flex items-center gap-1.5 shadow-pop-sm"
              >
                <span>VIEW OFFICIAL CERTIFICATE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <a
                href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
                  `${certificate.awardTitle} - ${certificate.title}`
                )}&organizationName=GoHackerz&issueYear=${new Date(
                  certificate.issuedAt
                ).getFullYear()}&issueMonth=${
                  new Date(certificate.issuedAt).getMonth() + 1
                }&certUrl=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? `${window.location.origin}/verify/${certificate.certNumber}`
                    : `https://gohackerz.com/verify/${certificate.certNumber}`
                )}&certId=${encodeURIComponent(certificate.certNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm bg-[#0A66C2] hover:bg-[#004182] text-white font-mono text-xs font-bold flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>ADD TO LINKEDIN</span>
              </a>
            </div>
          </div>
        ) : participant.submission ? (
          <div className="p-4 rounded-2xl bg-bg border border-ink/15 text-xs text-body leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
              <Sparkles className="w-4 h-4 text-purple" />
              <span>Project &quot;{participant.submission.title}&quot; Shipped & Recorded</span>
            </div>
            <p>
              Your project submission is verified and queued for judging. Once the hackathon concludes and judging closes, your official <strong>Hacker Certificate & Stamped Visa</strong> will automatically mint here.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-bg border border-ink/15 text-xs text-body leading-relaxed space-y-3">
            <p>
              You are admitted with boarding pass <strong>#{participant.ticketNumber}</strong>. To unlock your verified <strong>Hacker Certificate & Stamped Visa</strong>, you must build and submit your project before the deadline.
            </p>
            {isOwner && (
              <div className="pt-1">
                <Link
                  href={`/hackathons/${slug}/submit?ticket=${participant.ticketNumber}`}
                  className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold inline-flex items-center gap-1.5 shadow-pop-sm"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>SUBMIT PROJECT TO UNLOCK CREDENTIALS →</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Squad Alliance Management (Owner Only) */}
      {isOwner && (
        <div className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-6 max-w-[620px] mx-auto">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple" />
              <h3 className="font-mono text-sm font-black text-ink uppercase tracking-wider">
                {participant.teamCode || participant.teamName ? "SQUAD ALLIANCE ROSTER" : "SQUAD FORMATION"}
              </h3>
            </div>
            {participant.teamCode || participant.teamName ? (
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-brand-dark text-lime">
                {participant.isCaptain !== false ? "★ SQUAD CAPTAIN" : "● SQUAD MEMBER"}
              </span>
            ) : (
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-muted/20 text-muted">
                SOLO BUILDER
              </span>
            )}
          </div>

          {/* Incoming Squad Invite Alert */}
          {urlInviteTeam && participant.teamCode !== urlInviteTeam.code && (
            <div className="p-4 bg-lime/20 border-2 border-ink rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 anim-pop">
              <div className="space-y-1">
                <div className="font-mono text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple" /> SQUAD INVITE DETECTED
                </div>
                <p className="text-xs text-ink font-medium">
                  You have an invitation to join team <strong>&quot;{urlInviteTeam.name}&quot;</strong> ({urlInviteTeam.count}/4 members) with code <code>{urlInviteTeam.code}</code>.
                </p>
              </div>
              <button
                type="button"
                disabled={teamLoading}
                onClick={() => handleJoinSquadDirect(urlInviteTeam.code)}
                className="btn btn-sm btn-purple font-mono text-xs font-bold whitespace-nowrap shadow-pop-sm"
              >
                {teamLoading ? "JOINING..." : `JOIN "${urlInviteTeam.name.toUpperCase()}" ⚡`}
              </button>
            </div>
          )}

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

          {participant.teamCode || participant.teamName ? (
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
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">
                {new Date(participant.submission.createdAt).toLocaleDateString()}
              </span>
              {isOwner && (
                <Link
                  href={`/hackathons/${slug}/submit?ticket=${participant.ticketNumber}`}
                  className="font-mono text-xs font-bold text-purple hover:underline"
                >
                  Edit Project →
                </Link>
              )}
            </div>
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
