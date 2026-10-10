"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Building2,
  Mail,
  User,
  Calendar,
  Users,
  Trophy,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Ticket,
  Award,
  Zap,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

export function HostHackathonSection() {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactHandle, setContactHandle] = useState("");
  const [hackathonTitle, setHackathonTitle] = useState("");
  const [eventFormat, setEventFormat] = useState("weekend-48h");
  const [targetDates, setTargetDates] = useState("");
  const [expectedParticipants, setExpectedParticipants] = useState("200-500");
  const [estimatedPrizePool, setEstimatedPrizePool] = useState("$5,000 - $15,000");
  const [tracksAndGoals, setTracksAndGoals] = useState("");
  const [agenda, setAgenda] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName.trim() || !contactName.trim() || !contactEmail.trim() || !hackathonTitle.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/hackathons/host-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          contactName,
          contactEmail,
          contactHandle,
          hackathonTitle,
          eventFormat,
          targetDates,
          expectedParticipants,
          estimatedPrizePool,
          tracksAndGoals,
          agenda,
          specialRequirements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proposal.");
      }

      setSubmittedRef(data.refNumber || "GH-HOST-SUCCESS");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrgName("");
    setContactName("");
    setContactEmail("");
    setContactHandle("");
    setHackathonTitle("");
    setEventFormat("weekend-48h");
    setTargetDates("");
    setExpectedParticipants("200-500");
    setEstimatedPrizePool("$5,000 - $15,000");
    setTracksAndGoals("");
    setAgenda("");
    setSpecialRequirements("");
    setSubmittedRef(null);
    setError(null);
  };

  return (
    <section id="host-a-hackathon" className="relative py-12 sm:py-16 scroll-mt-10">
      <div className="bg-[#0D0924] border-2 border-ink rounded-3xl p-6 sm:p-12 shadow-pop-xl relative overflow-hidden text-white">
        {/* Decorative Grid Accent */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#7C5CFF_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#C6FF3D] font-mono text-xs font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D]" />
              <span>PARTNER & HOST PLATFORM</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Host Your Next Hackathon on <span className="text-[#C6FF3D]">GoHackerz</span>
            </h2>

            <p className="text-base text-[#D4CEF5] leading-relaxed">
              Power your developer competition with industry-leading tooling. From custom 3D
              holographic passports to instant cryptographically verifiable certificates and judging
              studios — we handle the infrastructure so you can focus on developer adoption.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#171138] border border-[#7C5CFF]/30">
                <div className="w-10 h-10 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-[#C6FF3D]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">3D Holographic Passports</h4>
                  <p className="text-xs text-[#a59fcf] mt-0.5 leading-relaxed">
                    Custom-branded interactive builder credentials with scannable verification QR codes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#171138] border border-[#7C5CFF]/30">
                <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#a88dff]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Automated Digital Certificates</h4>
                  <p className="text-xs text-[#a59fcf] mt-0.5 leading-relaxed">
                    Zero-overhead issuing of participation and podium certificates with public verification URLs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#171138] border border-[#7C5CFF]/30">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Lightweight Link Submissions</h4>
                  <p className="text-xs text-[#a59fcf] mt-0.5 leading-relaxed">
                    Zero heavy file uploads — seamlessly supports GitHub, live demos, Gamma pitch decks, and Loom.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stat / Testimonial Box */}
            <div className="p-4 rounded-2xl bg-[#130E29] border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-[#8B84AD] block uppercase">Response Time</span>
                <span className="font-bold text-sm text-white">&lt; 24h Partner Onboarding</span>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#C6FF3D]" />
            </div>
          </div>

          {/* Right Column: Interactive Proposal Form */}
          <div className="lg:col-span-7 bg-[#140E33] border-2 border-[#7C5CFF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            {submittedRef ? (
              <div className="py-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-3xl bg-[#C6FF3D]/10 border-2 border-[#C6FF3D] flex items-center justify-center mx-auto shadow-pop">
                  <CheckCircle2 className="w-9 h-9 text-[#C6FF3D]" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="font-mono text-xs text-[#C6FF3D] font-extrabold uppercase tracking-widest block">
                    APPLICATION SUBMITTED
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Proposal Received!
                  </h3>
                  <p className="text-sm text-[#D4CEF5] leading-relaxed">
                    Thank you for applying to host with GoHackerz. An official notification has been sent
                    to our event directors, and a confirmation receipt was delivered to{" "}
                    <strong className="text-white">{contactEmail}</strong>.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1440] border border-[#7C5CFF]/40 font-mono text-sm">
                  <span className="text-[#8B84AD]">REFERENCE ID:</span>
                  <span className="text-[#C6FF3D] font-bold">{submittedRef}</span>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn bg-[#7C5CFF] hover:bg-[#6c48ff] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl transition-all"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    Submit Hackathon Proposal
                  </h3>
                  <p className="text-xs text-[#a59fcf] mt-1">
                    Tell us about your proposed event. Our director team will evaluate and assist with setup.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 bg-rose-500/15 border-2 border-rose-500/40 rounded-xl flex items-center gap-3 text-xs text-rose-300 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Organization & Contact Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      ORGANIZATION / COMPANY <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Supabase, Stanford AI Club, Acme Corp"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      CONTACT PERSON <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Connor, DevRel Lead"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Email & Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      WORK / CONTACT EMAIL <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="sarah@acme.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      TELEGRAM / DISCORD / TWITTER
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="@username or discord tag"
                        value={contactHandle}
                        onChange={(e) => setContactHandle(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Hackathon Title & Target Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      PROPOSED HACKATHON TITLE <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Global Agentic AI Sprint 2026"
                      value={hackathonTitle}
                      onChange={(e) => setHackathonTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      TARGET TIMELINE / DATES
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Nov 15–18, 2026 or Q4 2026"
                        value={targetDates}
                        onChange={(e) => setTargetDates(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Expected Builders & Prize Pool */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      EXPECTED PARTICIPANTS
                    </label>
                    <select
                      value={expectedParticipants}
                      onChange={(e) => setExpectedParticipants(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all"
                    >
                      <option value="50-200">50 – 200 Developers</option>
                      <option value="200-500">200 – 500 Developers</option>
                      <option value="500-1500">500 – 1,500 Developers</option>
                      <option value="1500+">1,500+ Developers (Global Flagship)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      ESTIMATED PRIZE POOL / GRANTS
                    </label>
                    <div className="relative">
                      <Trophy className="w-4 h-4 text-[#8B84AD] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. $10,000 Cash + Cloud Credits"
                        value={estimatedPrizePool}
                        onChange={(e) => setEstimatedPrizePool(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Format Selection */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                    EVENT FORMAT & DURATION
                  </label>
                  <select
                    value={eventFormat}
                    onChange={(e) => setEventFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all"
                  >
                    <option value="weekend-48h">48-Hour Weekend Sprint (Standard Flagship)</option>
                    <option value="3-hours">3-Hours Flash Sprint (Live Prompt & Instant Demos)</option>
                    <option value="5-hours">5-Hours Buildathon (Fast Shipping)</option>
                    <option value="single-day">Single-Day 12-Hour Sprint</option>
                    <option value="async-marathon">Multi-Week Async Marathon (Global)</option>
                  </select>
                </div>

                {/* Proposed Tracks & Goals */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      PROPOSED TRACKS & THEMES
                    </label>
                    <span className="text-[10px] font-mono text-[#8B84AD]">Auto-configures arena tracks</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="e.g. Track 1: Edge AI, Track 2: Open Source DevTools, Track 3: Local-first Databases..."
                    value={tracksAndGoals}
                    onChange={(e) => setTracksAndGoals(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c] resize-y"
                  />
                </div>

                {/* Proposed Schedule & Agenda */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                      PROPOSED SCHEDULE & EVENT AGENDA
                    </label>
                    <span className="text-[10px] font-mono text-[#8B84AD]">Auto-generates event timeline</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="e.g.&#10;Day 1 · 10:00 UTC: Opening Keynote & Kickoff Broadcast&#10;Day 2 · 18:00 UTC: Architecture Check-in & Mentor Office Hours&#10;Day 3 · 20:00 UTC: Final Submission Deadline & Deliberation&#10;Day 4 · 18:00 UTC: Live Demos & Podium Winner Ceremony"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c] resize-y"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] font-bold text-[#D4CEF5] block">
                    ADDITIONAL NOTES / SPECIAL REQUIREMENTS
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Custom sponsor prizes, university hackathon logistics, private judging requirements..."
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0A071B] border border-[#7C5CFF]/30 focus:border-[#C6FF3D] rounded-xl font-sans text-xs text-white outline-none transition-all placeholder:text-[#58517c] resize-y"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn bg-[#C6FF3D] hover:bg-[#b5f028] text-[#0A071B] font-mono font-extrabold text-xs py-3.5 rounded-xl shadow-pop flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>SUBMITTING PROPOSAL & NOTIFYING ADMIN...</span>
                      </>
                    ) : (
                      <>
                        <span>SUBMIT HOST APPLICATION</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <span className="font-mono text-[10px] text-[#8B84AD] text-center block mt-2">
                    🔒 Automated confirmation receipt will be emailed immediately to {contactEmail || "your email"}.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
