"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getActiveTicketNumber, getMyPassport, saveMyPassport } from "@/lib/passport-storage";
import { Code, ExternalLink, Sparkles, Check, AlertCircle, ArrowRight, Video, Presentation, CheckCircle2 } from "lucide-react";

export default function HackathonSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "shipathon-2026";
  const initialTicket = searchParams.get("ticket") || "";

  const [ticketNumber, setTicketNumber] = useState(initialTicket);
  const [trackId, setTrackId] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [gammaUrl, setGammaUrl] = useState("");
  const [techStackInput, setTechStackInput] = useState("Next.js, TypeScript, Supabase, Tailwind");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [hackathonStatus, setHackathonStatus] = useState<string>("ACTIVE");
  const [hackathonTitle, setHackathonTitle] = useState<string>("Hackathon");
  const [tracks, setTracks] = useState<Array<{ id: string; title: string; prize?: string }>>([]);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // 1. Fetch Hackathon Status & Tracks
    fetch(`/api/hackathons/${slug}/status`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.hackathon) {
          setHackathonStatus(d.status || d.hackathon.status || "ACTIVE");
          setHackathonTitle(d.hackathon.title || "Hackathon");
          if (Array.isArray(d.hackathon.tracks) && d.hackathon.tracks.length > 0) {
            setTracks(d.hackathon.tracks);
            setTrackId((prev) => prev || d.hackathon.tracks[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));

    // 2. Fetch participant/ticket details if available
    const t = ticketNumber || initialTicket || getActiveTicketNumber(slug);
    if (t) {
      fetch(`/api/hackathons/${slug}/pass/${t}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.participant) {
            setTicketNumber(t);
            setIsRegistered(true);
            if (d.participant.submission) {
              const s = d.participant.submission;
              setIsEditingExisting(true);
              setTitle(s.title || "");
              setTagline(s.tagline || "");
              setDescription(s.description || "");
              setRepoUrl(s.repoUrl || "");
              setDemoUrl(s.demoUrl || "");
              setPitchDeckUrl(s.pitchDeckUrl || "");
              setVideoUrl(s.videoUrl || "");
              setGammaUrl(s.gammaUrl || "");
              if (s.trackId) setTrackId(s.trackId);
              if (s.techStack && s.techStack.length > 0) {
                setTechStackInput(s.techStack.join(", "));
              }
            }
          } else {
            setIsRegistered(false);
            if (!initialTicket) {
              setTicketNumber("");
            }
          }
        })
        .catch(() => {
          setIsRegistered(false);
          if (!initialTicket) {
            setTicketNumber("");
          }
        });
    } else {
      setIsRegistered(false);
    }
  }, [ticketNumber, initialTicket, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim()) {
      setError("Please provide your Ticket ID (e.g. GH-2026-X89B).");
      return;
    }
    if (!title.trim() || !repoUrl.trim()) {
      setError("Project title and GitHub repository link are required.");
      return;
    }

    setError(null);
    setLoading(true);

    const techStack = techStackInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/hackathons/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim().toUpperCase(),
          trackId,
          title,
          tagline,
          description,
          repoUrl,
          demoUrl,
          pitchDeckUrl,
          videoUrl,
          gammaUrl,
          techStack,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit project.");
      }

      // Update local storage so passport immediately knows about the submission!
      const cleanTicket = ticketNumber.trim().toUpperCase();
      const activeEmail = (localStorage.getItem("gh_active_email") || "").trim().toLowerCase();
      const existing = getMyPassport(slug, activeEmail || undefined);

      if (existing) {
        existing.submission = data.submission;
        saveMyPassport(existing);
      } else {
        saveMyPassport({
          id: `part-${cleanTicket.toLowerCase()}`,
          hackathonId: slug,
          ticketNumber: cleanTicket,
          name: data.submission.authorName || "Builder",
          email: activeEmail,
          roleTitle: "Fullstack & AI Engineer",
          themeStyle: "lime",
          isCaptain: false,
          submission: data.submission,
          createdAt: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/hackathons/${slug}/pass/${cleanTicket}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-3xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/hackathons/${slug}`}
            className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
          >
            ← BACK TO HACKATHON
          </Link>
          <span className="font-mono text-xs text-lime font-bold">● SUBMISSION PORTAL</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="font-mono text-xs text-purple font-extrabold uppercase tracking-widest block">
            LIGHTWEIGHT LINK SUBMISSION
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
            {hackathonStatus === "COMPLETED"
              ? "Submissions Concluded"
              : hackathonStatus === "JUDGING"
              ? "Submissions Locked for Judging"
              : "Submit Your Project"}
          </h1>
          <p className="text-sm sm:text-base text-body">
            {hackathonStatus === "COMPLETED"
              ? "This hackathon has ended and final results & certificates have been minted."
              : hackathonStatus === "JUDGING"
              ? "The submission deadline has closed. Project evaluations are underway."
              : "No heavy video or PDF file uploads. Simply link your GitHub repo, live demo, Gamma pitch deck, and YouTube walkthrough."}
          </p>
        </div>

        {/* Closed or Judging State */}
        {(hackathonStatus === "COMPLETED" || hackathonStatus === "JUDGING") ? (
          <div className="bg-card border-2 border-ink shadow-pop-xl rounded-3xl p-6 sm:p-10 space-y-6">
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center gap-3 text-sm text-amber-300 font-bold">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                {hackathonStatus === "COMPLETED"
                  ? "Hackathon finalized: Project submissions and edits are closed."
                  : "Judging in progress: Project submissions are locked."}
              </span>
            </div>

            {isEditingExisting && title ? (
              <div className="space-y-4 pt-2 border-t border-ink/10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">Your Recorded Submission</span>
                  <span className="px-2.5 py-1 bg-lime text-[#1A1440] font-mono text-xs font-black rounded-md">
                    VERIFIED SUBMISSION
                  </span>
                </div>
                <div className="p-5 bg-bg rounded-2xl border-2 border-ink/20 space-y-3">
                  <h3 className="text-xl font-bold text-ink">{title}</h3>
                  {tagline && <p className="text-sm text-body italic">"{tagline}"</p>}
                  {description && <p className="text-sm text-body">{description}</p>}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {repoUrl && (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-ink/20 rounded-lg text-xs font-mono font-bold text-purple hover:border-purple"
                      >
                        <span>GitHub Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {demoUrl && (
                      <a
                        href={demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-ink/20 rounded-lg text-xs font-mono font-bold text-lime hover:border-lime"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {pitchDeckUrl && (
                      <a
                        href={pitchDeckUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-ink/20 rounded-lg text-xs font-mono font-bold text-pink hover:border-pink"
                      >
                        <span>Pitch Deck</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-ink/10">
              <Link
                href={`/hackathons/${slug}/submissions`}
                className="btn btn-lime text-[#1A1440] font-mono font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <span>View All Submissions Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={ticketNumber ? `/hackathons/${slug}/pass/${ticketNumber}` : "/passport"}
                className="btn btn-purple font-mono font-bold text-sm px-6 py-3 rounded-xl"
              >
                <span>Access Hacker Passport</span>
              </Link>
              <Link
                href={`/hackathons/${slug}`}
                className="btn bg-bg border-2 border-ink text-ink font-mono font-bold text-sm px-6 py-3 rounded-xl hover:bg-card"
              >
                <span>Overview</span>
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="bg-card border-2 border-ink shadow-pop-xl rounded-3xl p-8 text-center space-y-4 anim-pop">
            <div className="w-12 h-12 rounded-full bg-lime text-brand-dark flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-extrabold text-ink">Project Successfully Submitted!</h2>
            <p className="text-sm text-body">
              Your Hacker Passport has been updated with verified submission status. Redirecting to
              your passport...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card border-2 border-ink shadow-pop-xl rounded-3xl p-6 sm:p-10 space-y-7"
          >
            {error && (
              <div className="p-4 bg-pink/10 border-2 border-pink rounded-2xl flex items-center gap-3 text-sm text-pink font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isRegistered === false && (
              <div className="p-4 bg-amber-500/15 border-2 border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold">
                    You must register for <strong>{hackathonTitle}</strong> to receive your verified Hacker Pass before submitting.
                  </span>
                </div>
                <Link
                  href={`/hackathons/${slug}/register`}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b5f028] text-[#0A071B] font-mono text-xs font-black transition-all shadow-sm inline-flex items-center gap-1.5"
                >
                  <span>Register &amp; Get Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Ticket ID */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-ink block">
                YOUR TICKET NUMBER <span className="text-pink">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GH-2026-X89B"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-mono text-sm uppercase text-ink outline-none transition-all"
              />
              <span className="font-mono text-[11px] text-muted block">
                Found on your official Hacker Passport for {hackathonTitle}.
              </span>
            </div>

            {/* Track Selection */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-ink block">
                COMPETITION TRACK <span className="text-pink">*</span>
              </label>
              <select
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
              >
                {tracks.length > 0 ? (
                  tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.prize ? `· ${t.prize}` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ai-agents">Autonomous AI Agents & Workflows (Cash Grants & Credits)</option>
                    <option value="edge-systems">Edge Architecture & High-Performance Web (Cash Grants & Credits)</option>
                    <option value="devex-tools">Developer Tools & Open Source Infrastructure (Cash Grants & Credits)</option>
                  </>
                )}
              </select>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block">
                  PROJECT TITLE <span className="text-pink">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PulseFlow AI, EdgeWhisper, TurboState"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block">
                  ONE-LINE TAGLINE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous PR review swarm reproducing race conditions at edge"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>
            </div>

            {/* Repo & Demo URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block">
                  GITHUB REPOSITORY URL <span className="text-pink">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block">
                  LIVE DEMO / DEPLOYED APP URL
                </label>
                <input
                  type="url"
                  placeholder="https://my-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>
            </div>

            {/* Pitch Deck & Video URLs (Lightweight Media Links) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5 text-purple" />
                  GAMMA / PPT / SLIDES URL
                </label>
                <input
                  type="url"
                  placeholder="https://gamma.app/... or Google Slides"
                  value={pitchDeckUrl}
                  onChange={(e) => {
                    setPitchDeckUrl(e.target.value);
                    if (e.target.value.includes("gamma.app")) {
                      setGammaUrl(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-ink block flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-pink" />
                  YOUTUBE / LOOM DEMO VIDEO URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or Loom"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-ink block">
                TECH STACK (COMMA-SEPARATED)
              </label>
              <input
                type="text"
                placeholder="Next.js, TypeScript, LangChain, Supabase Vector, Prisma"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-ink block">
                WHAT DOES IT DO & HOW WAS IT BUILT?
              </label>
              <textarea
                rows={4}
                placeholder="Brief breakdown of your architecture, technical hurdles solved, and how it ships value..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-bg border-2 border-ink/20 focus:border-purple rounded-xl font-sans text-sm text-ink outline-none transition-all resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-lime text-brand-dark font-black text-base py-4 rounded-2xl shadow-pop flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {loading ? (
                  <span>LOCKING IN SUBMISSION...</span>
                ) : (
                  <>
                    <span>SUBMIT PROJECT FOR JUDGING</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
