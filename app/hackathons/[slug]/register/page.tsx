"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { HackerPassport } from "@/components/HackerPassport";
import { saveMyPassport, getMyPassport } from "@/lib/passport-storage";
import type { HackathonParticipant, HackathonTheme } from "@/lib/hackathons";
import { Sparkles, Users, User, ArrowRight, ShieldCheck, Check, AlertCircle, RefreshCw, UserPlus } from "lucide-react";

export default function HackathonRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "shipathon-2026";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
  const [registeredParticipant, setRegisteredParticipant] = useState<HackathonParticipant | null>(
    null
  );

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

  // Check if this visitor already minted a passport in this browser
  useEffect(() => {
    const existing = getMyPassport("gh-shipathon-2026");
    if (existing) {
      setRegisteredParticipant(existing);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please provide your name and email address.");
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
    setLoading(true);

    const finalRole = roleTitle === "custom" ? customRole.trim() : roleTitle;

    try {
      const res = await fetch(`/api/hackathons/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          roleTitle: finalRole,
          bio,
          discordHandle,
          twitterHandle,
          themeStyle,
          teamOption,
          teamName,
          teamInviteCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.participant) {
        throw new Error(data.error || "Failed to register for the hackathon.");
      }

      // Persist permanently in localStorage and cookie
      saveMyPassport(data.participant);
      setRegisteredParticipant(data.participant);

      // Smoothly navigate directly to their new passport
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

        {/* If already registered in this session, show the Pass immediately! */}
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

            {/* The Animated 3D Holographic Passport */}
            <HackerPassport
              participant={registeredParticipant}
              hackathonTitle="Global Shipathon 2026"
              isOwner={true}
            />

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href={`/hackathons/${slug}/pass/${registeredParticipant.ticketNumber}`}
                className="font-mono text-xs font-bold text-purple underline hover:text-ink"
              >
                Go to Dedicated Ticket Page →
              </Link>
              <button
                type="button"
                onClick={() => setRegisteredParticipant(null)}
                className="font-mono text-xs text-muted hover:text-ink underline"
              >
                Register Another Hacker ↻
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="space-y-8">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="font-mono text-xs text-purple font-extrabold uppercase tracking-widest block">
                STEP 1 OF 2 // HACKER ONBOARDING
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
                Claim Your Hacker Passport
              </h1>
              <p className="text-sm sm:text-base text-body">
                Register as a solo builder or assemble a squad. Once registered, you will immediately
                receive your animated 3D cyber passport.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-card border-2 border-ink shadow-pop-xl rounded-3xl p-6 sm:p-10 space-y-8"
            >
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
                      FULL NAME <span className="text-pink">*</span>
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
                    <label className="font-mono text-xs font-bold text-ink block">
                      EMAIL ADDRESS <span className="text-pink">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="hacker@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      SPECIALTY / ROLE <span className="text-pink">*</span>
                    </label>
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    >
                      <option value="Fullstack & AI Engineer">Fullstack & AI Engineer</option>
                      <option value="Lead Systems Architect">Lead Systems Architect</option>
                      <option value="Frontend & UI/UX Wizard">Frontend & UI/UX Wizard</option>
                      <option value="Autonomous Agents Hacker">Autonomous Agents Hacker</option>
                      <option value="Edge / Rust Specialist">Edge / Rust Specialist</option>
                      <option value="Product & Solo Shipper">Product & Solo Shipper</option>
                      <option value="custom">✏️ Other / Custom Role (Type your own)...</option>
                    </select>

                    {roleTitle === "custom" && (
                      <div className="pt-2 anim-pop">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Smart Contract Security, Game Engine Dev, Vector DB Architect"
                          value={customRole}
                          onChange={(e) => setCustomRole(e.target.value)}
                          className="w-full px-4 py-2.5 bg-bg border-2 border-purple rounded-xl font-sans text-sm text-ink outline-none shadow-sm focus:ring-2 focus:ring-purple/20"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      DISCORD HANDLE
                    </label>
                    <input
                      type="text"
                      placeholder="hacker#1337"
                      value={discordHandle}
                      onChange={(e) => setDiscordHandle(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TWITTER / X HANDLE
                    </label>
                    <input
                      type="text"
                      placeholder="@build_fast"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Team Formation */}
              <div className="space-y-4 pt-4 border-t border-ink/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-mono text-xs font-black text-lime bg-brand-dark px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                    02 // SQUAD ALLIANCE
                  </h3>
                  {invitedTeamInfo && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" /> INVITATION ACTIVE
                    </span>
                  )}
                </div>

                {invitedTeamInfo && (
                  <div className="p-3.5 bg-brand-dark border-2 border-lime rounded-2xl flex items-center gap-3 text-sm text-white font-bold anim-pop shadow-sm">
                    <UserPlus className="w-5 h-5 shrink-0 text-lime" />
                    <div>
                      <div>
                        Joining Squad: <strong className="text-lime">{invitedTeamInfo.name}</strong>
                      </div>
                      <div className="text-xs font-mono font-normal text-muted">
                        Roster: {invitedTeamInfo.count}/4 builders · Your pass will link to this team automatically.
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTeamOption("solo")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "solo"
                        ? "bg-purple text-white border-ink shadow-pop-sm"
                        : "bg-bg text-ink border-ink/15 hover:border-purple"
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">Hack Solo</div>
                    <div className="text-xs opacity-80">
                      Rely on your own raw skills. No teammates required.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamOption("create")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "create"
                        ? "bg-purple text-white border-ink shadow-pop-sm"
                        : "bg-bg text-ink border-ink/15 hover:border-purple"
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">Create Team</div>
                    <div className="text-xs opacity-80">
                      Found a team and receive a unique invite code to share.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamOption("join")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      teamOption === "join"
                        ? "bg-purple text-white border-ink shadow-pop-sm"
                        : "bg-bg text-ink border-ink/15 hover:border-purple"
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">Join Team</div>
                    <div className="text-xs opacity-80">
                      Enter an existing team invite code from a friend.
                    </div>
                  </button>
                </div>

                {teamOption === "create" && (
                  <div className="space-y-1.5 anim-pop">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TEAM NAME <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Void Runners, CyberPunks, ZeroDay"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                    />
                    <span className="font-mono text-[11px] text-muted block">
                      We will automatically generate a team invite code for your squad.
                    </span>
                  </div>
                )}

                {teamOption === "join" && (
                  <div className="space-y-1.5 anim-pop">
                    <label className="font-mono text-xs font-bold text-ink block">
                      TEAM INVITE CODE <span className="text-pink">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VOID-42 or HACK-7891"
                      value={teamInviteCode}
                      onChange={(e) => setTeamInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-mono text-sm text-ink uppercase tracking-wider outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* 3. Passport Theme Choice */}
              <div className="space-y-4 pt-4 border-t border-ink/10">
                <h3 className="font-mono text-xs font-black text-lime bg-brand-dark px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                  03 // PASSPORT HOLOGRAPHIC THEME
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "lime", label: "Cyber Lime", color: "bg-lime" },
                    { id: "neon", label: "Hyper Neon", color: "bg-pink" },
                    { id: "matrix", label: "Matrix Terminal", color: "bg-[#00FF66]" },
                    { id: "gold", label: "VIP Gold", color: "bg-[#FFD700]" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeStyle(t.id as HackathonTheme)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left font-mono text-xs font-bold transition-all ${
                        themeStyle === t.id
                          ? "bg-brand-dark text-white border-lime shadow-pop-sm"
                          : "bg-bg text-ink border-ink/15 hover:border-ink"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-ink/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-lime text-brand-dark font-black text-base py-4 rounded-2xl shadow-pop flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  {loading ? (
                    <span>MINTING HACKER CREDENTIALS...</span>
                  ) : (
                    <>
                      <span>MINT HACKER PASSPORT & JOIN</span>
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
