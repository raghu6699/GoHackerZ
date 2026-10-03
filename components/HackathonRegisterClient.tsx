"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HackerPassport } from "@/components/HackerPassport";
import { saveMyPassport, getMyPassport } from "@/lib/passport-storage";
import type { HackathonParticipant, HackathonTheme, HackathonData } from "@/lib/hackathons";
import { Sparkles, Users, User, ArrowRight, ShieldCheck, Check, AlertCircle, RefreshCw, UserPlus, Lock } from "lucide-react";

interface HackathonRegisterClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
  };
  hackathon: HackathonData;
  slug: string;
  initialParticipant?: HackathonParticipant | null;
}

export function HackathonRegisterClient({
  user,
  hackathon,
  slug,
  initialParticipant = null,
}: HackathonRegisterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(user.name || "");
  const [email] = useState(user.email);
  const [roleTitle, setRoleTitle] = useState("Fullstack & AI Engineer");
  const [customRole, setCustomRole] = useState("");
  const [bio, setBio] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [themeStyle, setThemeStyle] = useState<HackathonTheme>("lime");

  // Team formation options
  const [teamOption, setTeamOption] = useState<"solo" | "create" | "join">("solo");
  const [teamName, setTeamName] = useState("");
  const [teamInviteCode, setTeamInviteCode] = useState("");
  const [invitedTeamInfo, setInvitedTeamInfo] = useState<{ name: string; count: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTicketWarning, setExistingTicketWarning] = useState<{
    ticketNumber: string;
    passportUrl: string;
    message: string;
    participant?: HackathonParticipant;
  } | null>(null);

  // Email Lookup / Passport History Retrieval
  const [showLookup, setShowLookup] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    success: boolean;
    message: string;
    ticketNumber?: string;
    passportUrl?: string;
  } | null>(null);

  const [registeredParticipant, setRegisteredParticipant] = useState<HackathonParticipant | null>(
    initialParticipant
  );
  const [joiningInvite, setJoiningInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  const handleJoinFromInvite = async (codeToJoin: string) => {
    if (!registeredParticipant) return;
    setJoiningInvite(true);
    setInviteSuccessMsg(null);
    try {
      const res = await fetch(`/api/hackathons/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          ticketNumber: registeredParticipant.ticketNumber,
          teamCode: codeToJoin.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to join team.");
      }
      setRegisteredParticipant(data.participant);
      saveMyPassport(data.participant);
      setInviteSuccessMsg(`Joined squad "${data.team?.name || codeToJoin}"!`);
      // Sync back to server
      fetch(`/api/hackathons/${slug}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: data.participant }),
      }).catch(() => {});
    } catch (err: any) {
      alert(err.message || "Failed to join squad.");
    } finally {
      setJoiningInvite(false);
    }
  };

  // Check if visitor arrived via 1-click team invite link
  useEffect(() => {
    const invite =
      searchParams?.get("team") ||
      searchParams?.get("join") ||
      searchParams?.get("invite") ||
      searchParams?.get("code");

    if (invite) {
      const clean = invite.trim().toUpperCase();
      setTeamOption("join");
      setTeamInviteCode(clean);
      fetch(`/api/hackathons/${slug}/team?code=${clean}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.team) {
            setInvitedTeamInfo({ name: data.team.name, count: data.team.membersCount });
          }
        })
        .catch(() => {});
    }
  }, [searchParams, slug]);

  // Check if this visitor already minted a passport in this browser for THIS email
  useEffect(() => {
    if (initialParticipant) {
      setRegisteredParticipant(initialParticipant);
      saveMyPassport(initialParticipant);
      return;
    }

    const existing = getMyPassport(hackathon.id || "gh-shipathon-2026", user.email);
    if (
      existing &&
      existing.email &&
      existing.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    ) {
      setRegisteredParticipant(existing);
    } else {
      setRegisteredParticipant(null);
    }
  }, [hackathon.id, user.email, initialParticipant]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/hackathons/${slug}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      const data = await res.json();
      if (!res.ok || !data.found) {
        setLookupResult({
          success: false,
          message: data.message || `No registered passport found for your account email (${email}).`,
        });
        return;
      }

      if (data.participant) {
        saveMyPassport(data.participant);
      }

      setLookupResult({
        success: true,
        message: `Found Passport #${data.ticketNumber}!`,
        ticketNumber: data.ticketNumber,
        passportUrl: data.passportUrl,
      });
    } catch (err: any) {
      setLookupResult({
        success: false,
        message: err.message || "Lookup request failed.",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide your hacker name.");
      return;
    }

    if (roleTitle === "custom" && !customRole.trim()) {
      setError("Please type your custom specialty/role.");
      return;
    }

    if (teamOption === "create" && !teamName.trim()) {
      setError("Please provide a name for your new team.");
      return;
    }

    if (teamOption === "join" && !teamInviteCode.trim()) {
      setError("Please enter the team invite code.");
      return;
    }

    setError(null);
    setExistingTicketWarning(null);
    setLoading(true);

    const finalRole = roleTitle === "custom" ? customRole.trim() : roleTitle;

    try {
      const res = await fetch(`/api/hackathons/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: user.email,
          roleTitle: finalRole,
          bio,
          discordHandle,
          twitterHandle,
          avatarUrl: user.avatarUrl || undefined,
          themeStyle,
          teamOption,
          teamName,
          teamInviteCode,
        }),
      });

      const data = await res.json();

      // Check if user is already registered (409 Conflict)
      if (res.status === 409 || data.alreadyRegistered) {
        if (data.participant) {
          saveMyPassport(data.participant);
        }
        setExistingTicketWarning({
          ticketNumber: data.ticketNumber,
          passportUrl: data.passportUrl || `/hackathons/${slug}/pass/${data.ticketNumber}`,
          message: data.error || "Your account is already registered for this hackathon.",
          participant: data.participant,
        });
        return;
      }

      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to register for the hackathon.");
      }

      // Persist permanently in localStorage and cookie
      saveMyPassport(data.participant);
      setRegisteredParticipant(data.participant);

      // Navigate to passport
      router.push(`/hackathons/${slug}/pass/${data.participant.ticketNumber}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-4xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/hackathons/${slug}`}
            className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
          >
            ← BACK TO EVENT OVERVIEW
          </Link>
          <span className="font-mono text-xs text-lime font-bold">● REGISTRATION OPEN</span>
        </div>

        {/* If already registered in this session, show the Pass immediately */}
        {registeredParticipant ? (
          <div className="space-y-8 anim-pop">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-black">
                <Check className="w-3.5 h-3.5" /> PASSPORT ISSUED SUCCESSFULLY
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
                Welcome to the Arena.
              </h1>
              <p className="text-sm sm:text-base text-body">
                Your credentials have been securely minted. Point your camera at the QR code,
                download your high-res pass, or share your badge on socials!
              </p>
            </div>

            {/* Incoming Squad Invite Banner for Already Registered Hacker */}
            {teamInviteCode && invitedTeamInfo && registeredParticipant.teamCode !== teamInviteCode && (
              <div className="bg-lime/20 border-2 border-ink rounded-3xl p-6 shadow-pop text-ink max-w-2xl mx-auto space-y-3 anim-pop">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple" />
                    <h3 className="font-mono text-sm font-black uppercase tracking-wider text-ink">
                      SQUAD INVITE DETECTED
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-purple text-white px-2.5 py-1 rounded-full">
                    CODE: {teamInviteCode}
                  </span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  You have an invitation to join squad <strong>&quot;{invitedTeamInfo.name}&quot;</strong> ({invitedTeamInfo.count}/4 members).
                  Click below to link your Hacker Passport to this squad:
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={joiningInvite}
                    onClick={() => handleJoinFromInvite(teamInviteCode)}
                    className="btn btn-sm btn-purple font-mono text-xs font-bold flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-lime" />
                    {joiningInvite ? "JOINING SQUAD..." : `ACCEPT INVITE & JOIN "${invitedTeamInfo.name.toUpperCase()}" ⚡`}
                  </button>
                </div>
              </div>
            )}

            {inviteSuccessMsg && (
              <div className="bg-lime/20 border-2 border-lime text-brand-dark p-4 rounded-2xl max-w-2xl mx-auto font-mono text-xs font-bold flex items-center gap-2 anim-pop">
                <span>✓</span>
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            {/* Squad Created Alert Banner */}
            {registeredParticipant.teamCode && (
              <div className="bg-brand-dark border-2 border-lime rounded-3xl p-6 shadow-pop text-white max-w-2xl mx-auto space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-lime" />
                    <h3 className="font-mono text-sm font-black text-lime uppercase tracking-wider">
                      SQUAD ALLIANCE: &quot;{registeredParticipant.teamName || "Squad"}&quot;
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#d4cef5] bg-purple/40 px-2.5 py-1 rounded-full border border-purple">
                    {registeredParticipant.isCaptain ? "★ SQUAD CAPTAIN" : "● SQUAD MEMBER"}
                  </span>
                </div>
                <p className="text-xs text-[#D4CEF5] leading-relaxed">
                  Share your squad invite code with up to 3 teammates so their Hacker Passports automatically link to your team roster:
                </p>
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <div className="font-mono font-black text-base text-lime bg-black/50 px-4 py-2 rounded-xl border border-lime/40 tracking-wider">
                    {registeredParticipant.teamCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/hackathons/${slug}/register?team=${registeredParticipant.teamCode}`;
                      navigator.clipboard.writeText(link);
                      alert(`Squad invite link copied!\n${link}`);
                    }}
                    className="btn btn-sm btn-lime text-[#1A1440] font-mono text-xs font-bold"
                  >
                    COPY SQUAD INVITE LINK 📋
                  </button>
                </div>
              </div>
            )}

            <HackerPassport
              participant={registeredParticipant}
              hackathonTitle={hackathon.title}
              isOwner={true}
              slug={slug}
              ticketId={registeredParticipant.ticketNumber}
            />

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href={`/hackathons/${slug}/pass/${registeredParticipant.ticketNumber}`}
                className="font-mono text-xs font-bold text-purple underline hover:text-ink"
              >
                Go to Dedicated Ticket Page →
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="space-y-8">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="font-mono text-xs text-purple font-extrabold uppercase tracking-widest block">
                AUTHENTICATED HACKER REGISTRATION
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
                Claim Your Hacker Passport
              </h1>
              <p className="text-sm sm:text-base text-body">
                Register as a solo builder or assemble a squad for <strong>{hackathon.title}</strong>. Your ticket will be linked directly to <strong>{user.email}</strong>.
              </p>

              {/* Already Registered Lookup Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowLookup(!showLookup)}
                  className="font-mono text-xs font-bold text-purple hover:text-ink underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {showLookup ? "Hide Passport Lookup" : "Check existing ticket status"}
                </button>
              </div>
            </div>

            {/* Email Lookup Card */}
            {showLookup && (
              <div className="bg-brand-dark/95 border-2 border-purple rounded-3xl p-6 shadow-pop text-white max-w-xl mx-auto anim-pop space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-lime" />
                  <h3 className="font-mono text-sm font-black text-lime uppercase tracking-wider">
                    FIND MY HACKER PASSPORT
                  </h3>
                </div>
                <p className="font-sans text-xs text-white/80">
                  Search for tickets issued under your logged-in email <strong>({user.email})</strong>:
                </p>
                <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    readOnly
                    value={user.email}
                    className="flex-1 px-4 py-2.5 bg-bg/20 border border-white/20 rounded-xl font-mono text-xs text-white outline-none cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {lookupLoading ? "SEARCHING..." : "RECOVER PASS →"}
                  </button>
                </form>

                {lookupResult && (
                  <div
                    className={`p-3 rounded-xl font-mono text-xs font-bold border ${
                      lookupResult.success
                        ? "bg-lime/20 border-lime text-lime"
                        : "bg-pink/20 border-pink text-pink"
                    }`}
                  >
                    <div>{lookupResult.message}</div>
                    {lookupResult.success && lookupResult.passportUrl && (
                      <div className="mt-2">
                        <Link
                          href={lookupResult.passportUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime text-brand-dark font-black text-xs hover:bg-lime/90"
                        >
                          OPEN PASSPORT #{lookupResult.ticketNumber} →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-card border-2 border-ink shadow-pop-xl rounded-3xl p-6 sm:p-10 space-y-8"
            >
              {/* Existing Ticket Banner */}
              {existingTicketWarning && (
                <div className="p-5 bg-purple/10 border-2 border-purple rounded-2xl space-y-3 anim-pop">
                  <div className="flex items-center gap-2 text-purple font-mono text-xs font-black uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> ALREADY REGISTERED FOR THIS EVENT
                  </div>
                  <p className="text-xs text-body leading-relaxed">
                    {existingTicketWarning.message}
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <Link
                      href={existingTicketWarning.passportUrl}
                      className="btn btn-sm btn-purple font-mono text-xs font-black flex items-center gap-1.5"
                    >
                      VIEW MY PASSPORT (#{existingTicketWarning.ticketNumber}) →
                    </Link>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-pink/10 border-2 border-pink rounded-2xl flex items-center gap-3 text-sm text-pink font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Hacker Identity */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs font-black text-lime bg-brand-dark px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                  01 // HACKER PROFILE
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      HACKER / DISPLAY NAME <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satoshi Nakamoto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs font-bold text-ink block">
                        VERIFIED ACCOUNT EMAIL
                      </label>
                      <span className="font-mono text-[10px] text-purple font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={email}
                      className="w-full px-4 py-3 bg-bg/50 border-2 border-ink/20 rounded-xl font-mono text-sm text-muted cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Role / Specialty Selection */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-ink block">
                    SPECIALTY / ROLE TITLE <span className="text-pink">*</span>
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none"
                  >
                    <option value="Fullstack & AI Engineer">Fullstack & AI Engineer</option>
                    <option value="Systems & Distributed Systems Architect">
                      Systems & Distributed Systems Architect
                    </option>
                    <option value="LLM & Autonomous Agent Developer">
                      LLM & Autonomous Agent Developer
                    </option>
                    <option value="Frontend Craft & Design Engineer">
                      Frontend Craft & Design Engineer
                    </option>
                    <option value="Backend & Database Engineer">Backend & Database Engineer</option>
                    <option value="DevOps, Cloud & Edge Infrastructure">
                      DevOps, Cloud & Edge Infrastructure
                    </option>
                    <option value="Security & Protocol Researcher">
                      Security & Protocol Researcher
                    </option>
                    <option value="custom">Other / Custom Specialty →</option>
                  </select>

                  {roleTitle === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="Type your specialty (e.g. Compiler Engineer)"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="w-full mt-2 px-4 py-3 bg-bg border-2 border-purple rounded-xl font-sans text-sm text-ink outline-none anim-pop"
                    />
                  )}
                </div>

                {/* Social Handles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      DISCORD HANDLE (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Satoshi#1337 or satoshi"
                      value={discordHandle}
                      onChange={(e) => setDiscordHandle(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TWITTER / X HANDLE (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @satoshi"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="font-mono text-xs font-bold text-ink block">
                    BIO / HACKER TAGLINE (OPTIONAL)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What are you excited to build during the 48-hour sprint?"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none"
                  />
                </div>
              </div>

              {/* 2. Team Formation */}
              <div className="space-y-4 pt-4 border-t-2 border-ink/10">
                <h3 className="font-mono text-xs font-black text-lime bg-brand-dark px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                  02 // SQUAD FORMATION
                </h3>

                {/* 1-Click Invited Squad Notice */}
                {invitedTeamInfo && (
                  <div className="p-4 bg-lime/20 border-2 border-ink rounded-2xl flex items-center justify-between gap-3 anim-pop">
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple" /> SQUAD INVITE DETECTED
                      </div>
                      <p className="text-xs text-ink font-medium">
                        You are registering to join team <strong>&quot;{invitedTeamInfo.name}&quot;</strong> ({invitedTeamInfo.count}/4 members).
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTeamOption("solo")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "solo"
                        ? "border-purple bg-purple/10 shadow-pop-sm"
                        : "border-ink/20 bg-bg hover:border-ink"
                    }`}
                  >
                    <User className="w-5 h-5 text-purple mb-2" />
                    <div className="font-bold text-sm text-ink">Solo Builder</div>
                    <div className="text-xs text-muted mt-1">Hack alone & win solo glory.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamOption("create")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "create"
                        ? "border-purple bg-purple/10 shadow-pop-sm"
                        : "border-ink/20 bg-bg hover:border-ink"
                    }`}
                  >
                    <UserPlus className="w-5 h-5 text-purple mb-2" />
                    <div className="font-bold text-sm text-ink">Create a Squad</div>
                    <div className="text-xs text-muted mt-1">Form a team & invite friends.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamOption("join")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "join"
                        ? "border-purple bg-purple/10 shadow-pop-sm"
                        : "border-ink/20 bg-bg hover:border-ink"
                    }`}
                  >
                    <Users className="w-5 h-5 text-purple mb-2" />
                    <div className="font-bold text-sm text-ink">Join Existing Squad</div>
                    <div className="text-xs text-muted mt-1">Enter a team invite code.</div>
                  </button>
                </div>

                {teamOption === "create" && (
                  <div className="space-y-1.5 pt-2 anim-pop">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TEAM NAME <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CyberPunks 2077"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-purple rounded-xl font-sans text-sm text-ink outline-none"
                    />
                    <p className="font-mono text-[11px] text-muted">
                      An invite code will be automatically generated for your teammates once you register.
                    </p>
                  </div>
                )}

                {teamOption === "join" && (
                  <div className="space-y-1.5 pt-2 anim-pop">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TEAM INVITE CODE <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HACK-7492"
                      value={teamInviteCode}
                      onChange={(e) => setTeamInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-bg border-2 border-purple rounded-xl font-mono text-sm uppercase tracking-wider text-ink outline-none"
                    />
                  </div>
                )}
              </div>

              {/* 3. Passport Theme Aesthetic */}
              <div className="space-y-4 pt-4 border-t-2 border-ink/10">
                <h3 className="font-mono text-xs font-black text-lime bg-brand-dark px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                  03 // PASSPORT HOLOGRAPHIC THEME
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: "lime", name: "Cyber Lime", color: "bg-[#CCFF00]" },
                    { id: "purple", name: "Neon Purple", color: "bg-[#C084FC]" },
                    { id: "sky", name: "Supersonic Cyan", color: "bg-[#38BDF8]" },
                    { id: "pink", name: "Neon Magenta", color: "bg-[#F472B6]" },
                    { id: "amber", name: "Solar Gold", color: "bg-[#FBBF24]" },
                  ].map((theme) => {
                    const isSelected = themeStyle === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setThemeStyle(theme.id as HackathonTheme)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left ${
                          isSelected
                            ? "border-purple bg-purple/15 shadow-pop-sm scale-105 ring-2 ring-purple font-black"
                            : "border-ink/20 bg-bg opacity-75 hover:opacity-100 hover:border-ink"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border border-ink/40 shrink-0 ${theme.color}`} />
                        <span className="font-mono text-xs text-ink truncate">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-lg btn-purple font-mono font-black text-sm uppercase tracking-wider py-4 rounded-2xl shadow-pop flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>MINTING HACKER PASSPORT...</span>
                  ) : (
                    <>
                      <span>MINT HACKER PASSPORT & ENTER ARENA</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
