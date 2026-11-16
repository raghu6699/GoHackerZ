import Link from "next/link";
import type { HackathonData, HackathonCertificate } from "@/lib/hackathons";
import { VoiceFlowPill } from "./VoiceFlowPill";
import { EventCountdown } from "./EventCountdown";
import { StickyRegisterBar } from "./StickyRegisterBar";
import { WinnersSection } from "./WinnersSection";
import { MyPassportBanner } from "@/components/MyPassportBanner";
const FLOW_URL = "https://wisprflow.ai";

import { Download, ExternalLink, ArrowRight, Mic, Hammer, PenLine, Shield, Trophy, Clock, MapPin, Globe2 } from "lucide-react";

const CRITERIA = [
  { label: "Impact and usefulness", pts: 30, note: "Does it solve a real problem for real people?" },
  { label: "Working demo", pts: 25, note: "It runs, it's clear, and judges can try it." },
  { label: "Build log quality", pts: 25, note: "The voice process, the mistakes and the lessons." },
  { label: "UX and UI", pts: 20, note: "Clear, accessible and pleasant to use." },
];

const LOG_TEMPLATE = [
  "The problem and who it's for",
  "Your voice workflow: agent, model, setup",
  "Example dictations that worked, and the ones that didn't",
  "Your build timeline",
  "What you shipped, with repo and demo links",
  "Tips for the next builder",
];

/** The Flow logo is a trademark of its owner, used here to point people to the product. */
function FlowWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-xl bg-white px-3 py-1.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/events/flow-logo.png" alt="Wispr Flow" className="bg-transparent h-6 w-auto" />
    </span>
  );
}


/* ---------- Track visuals: spoken phrase on the left, the app it could become on the right ---------- */
const TRACK_VIS: Record<string, { accent: string; bg: string; phrase: string }> = {
  health: { accent: "#FF7A9A", bg: "radial-gradient(120% 90% at 85% 0%,#5a1a47 0%,#1c1038 60%)", phrase: "What is this tablet for?" },
  farm: { accent: "#C6FF3D", bg: "radial-gradient(120% 90% at 85% 0%,#1f5a33 0%,#14213d 60%)", phrase: "Tomato price today?" },
  learn: { accent: "#7CC4FF", bg: "radial-gradient(120% 90% at 85% 0%,#1d4a85 0%,#1c1038 60%)", phrase: "Explain fractions simply" },
  shops: { accent: "#FFB84D", bg: "radial-gradient(120% 90% at 85% 0%,#6b4510 0%,#1c1038 60%)", phrase: "Two kilos rice, one tea" },
  citizen: { accent: "#B9A7FF", bg: "radial-gradient(120% 90% at 85% 0%,#3d2a85 0%,#0f1a3a 60%)", phrase: "Which schemes can I get?" },
};

const TRACK_STYLES = `
@keyframes bb-ripple { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.3); opacity: 0; } }
@keyframes bb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes bb-bar { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
.bb-ripple { animation: bb-ripple 2.4s ease-out infinite; }
.bb-float { animation: bb-float 5s ease-in-out infinite; }
.bb-bar { animation: bb-bar 900ms ease-in-out infinite alternate; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .bb-ripple, .bb-float, .bb-bar { animation: none; } }
`;

/** The mini app screen shown inside the phone, one per track. */
function PhoneScreen({ id, accent }: { id: string; accent: string }) {
  const row = "flex items-center justify-between rounded-md bg-white/10 px-1.5 py-1";
  switch (id) {
    case "health":
      return (
        <div className="space-y-1.5">
          <div className="text-[8px] font-bold text-white/60">YOUR PRESCRIPTION</div>
          <div className={row}>
            <span className="text-[9px] font-bold text-white">Paracetamol</span>
            <span className="h-2.5 w-5 rounded-full" style={{ background: accent }} />
          </div>
          <div className="text-[8px] text-white/70">1 morning · 1 night</div>
          <div className="inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold text-[#1A1440]" style={{ background: accent }}>After food</div>
          <div className="flex items-end gap-0.5 pt-1">
            {[6, 10, 7, 12, 8].map((h, i) => (
              <span key={i} className="w-1.5 rounded-sm bg-white/30" style={{ height: h * 1.4 }} />
            ))}
          </div>
        </div>
      );
    case "farm":
      return (
        <div className="space-y-1.5">
          <div className="text-[8px] font-bold text-white/60">TOMATO · TODAY</div>
          <div className="text-[18px] font-black leading-none text-white">₹28<span className="text-[9px] font-bold text-white/60">/kg</span></div>
          <svg viewBox="0 0 80 30" className="h-7 w-full">
            <polyline points="0,24 14,20 28,22 42,14 56,16 70,6 80,8" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={row}>
            <span className="text-[8px] text-white/80">Rain Thursday</span>
            <span className="text-[9px]">🌧</span>
          </div>
        </div>
      );
    case "learn":
      return (
        <div className="space-y-1.5">
          <div className="ml-auto w-fit max-w-full rounded-lg rounded-br-sm bg-white/15 px-1.5 py-1 text-[8px] text-white">Add 1/2 and 1/4</div>
          <div className="w-fit max-w-full rounded-lg rounded-bl-sm px-1.5 py-1 text-[8px] font-semibold text-[#1A1440]" style={{ background: accent }}>1/2 + 1/4 = 3/4</div>
          <svg viewBox="0 0 40 40" className="mx-auto h-9 w-9">
            <circle cx="20" cy="20" r="16" fill="rgba(255,255,255,.15)" />
            <path d="M20 20V4a16 16 0 1 1-16 16Z" fill={accent} />
          </svg>
        </div>
      );
    case "shops":
      return (
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/60">TODAY'S BILL</div>
          <div className={row}><span className="text-[8px] text-white">Rice 2 kg</span><span className="text-[8px] font-bold text-white">₹120</span></div>
          <div className={row}><span className="text-[8px] text-white">Tea 1</span><span className="text-[8px] font-bold text-white">₹10</span></div>
          <div className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-[#1A1440]" style={{ background: accent }}>
            <span className="text-[8px] font-black">TOTAL</span>
            <span className="text-[11px] font-black">₹130</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <div className="text-[8px] font-bold text-white/60">YOU MAY QUALIFY FOR</div>
          {["Pension scheme", "Ration card", "Scholarship"].map((t) => (
            <div key={t} className={row}>
              <span className="text-[8px] text-white">{t}</span>
              <span className="flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-black text-[#1A1440]" style={{ background: accent }}>✓</span>
            </div>
          ))}
        </div>
      );
  }
}

function TrackVisual({ id }: { id: string }) {
  const v = TRACK_VIS[id] ?? TRACK_VIS.citizen;
  return (
    <div className="relative mb-4 h-52 overflow-hidden rounded-2xl border border-white/10" style={{ background: v.bg }} aria-hidden>
      {/* soft glow */}
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: v.accent }} />

      {/* left: someone speaking */}
      <div className="absolute left-4 top-5 flex w-[52%] flex-col items-start gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="bb-ripple absolute inset-0 rounded-full" style={{ background: v.accent }} />
          <span className="bb-ripple absolute inset-0 rounded-full" style={{ background: v.accent, animationDelay: "1.2s" }} />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: v.accent }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1A1440">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
            </svg>
          </span>
        </div>
        <div className="flex h-6 items-center gap-[3px]">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="bb-bar h-6 w-[3px] rounded-full" style={{ background: v.accent, animationDelay: `${(i % 6) * 110}ms`, opacity: 0.9 }} />
          ))}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">A user might say</div>
        <div className="rounded-2xl rounded-tl-sm border border-white/15 bg-black/45 px-3 py-2 text-[12px] font-semibold leading-snug text-white backdrop-blur-md">
          &ldquo;{v.phrase}&rdquo;
        </div>
      </div>

      {/* right: the app it could become, peeking up from the bottom */}
      <div className="bb-float absolute -bottom-10 right-4 h-[188px] w-[112px] rounded-[22px] border-2 border-white/25 bg-[#0d0a22] p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/25" />
        <PhoneScreen id={id} accent={v.accent} />
      </div>

      <span className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white/50">Concept</span>
    </div>
  );
}

const PAGE_STYLES = `
@keyframes bb-reveal { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  .bb-reveal { animation: bb-reveal linear both; animation-timeline: view(); animation-range: entry 0% entry 30%; }
}
@media (prefers-reduced-motion: reduce) { .bb-reveal { animation: none !important; } }
`;

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#C6FF3D]">{kicker}</p>
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">{title}</h2>
    </div>
  );
}

export function BoloBuildPage({
  hackathon,
  isAdmin,
  submissionsCount,
  winners = [],
}: {
  hackathon: HackathonData;
  isAdmin: boolean;
  submissionsCount: number;
  winners?: HackathonCertificate[];
}) {
  const slug = hackathon.slug;
  const open = hackathon.status !== "COMPLETED" && hackathon.status !== "JUDGING";

  return (
    <div className="bg-[#0B0820] text-white">
      <style>{TRACK_STYLES + PAGE_STYLES}</style>
      {open && <StickyRegisterBar href={`/hackathons/${slug}/register`} title={hackathon.title} dateLabel="Sat 28 Nov · 10am IST" />}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pt-6">
          <MyPassportBanner slug={slug} hackathonId={hackathon.id} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(124,92,255,0.45), transparent 70%), radial-gradient(40% 40% at 90% 30%, rgba(198,255,61,0.12), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-size:28px_28px] bg-[radial-gradient(#fff_1px,transparent_1px)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center gap-[5px] opacity-[0.22]" aria-hidden>
          {Array.from({ length: 64 }).map((_, i) => (
            <span
              key={i}
              className="bb-bar w-[5px] rounded-full bg-gradient-to-t from-[#7C5CFF] to-[#C6FF3D]"
              style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 12) * 90}ms`, animationDuration: `${800 + (i % 7) * 140}ms` }}
            />
          ))}
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-16 pt-10 sm:pt-16 text-center">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="inline-flex items-center rounded-xl bg-white px-2 py-0.5"><img src="/logo/header-logo.png" alt="RepoRally" className="bg-transparent h-10 w-auto" /></span>
            <span className="text-white/30">×</span>
            <FlowWordmark className="text-white" />
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 font-mono text-xs font-bold">
            <span className="rounded-full border border-[#C6FF3D]/40 bg-[#C6FF3D]/10 px-3 py-1 text-[#C6FF3D]">SAT 28 NOV 2026</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80">HYDERABAD + ONLINE</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80">10AM–6PM IST · VOICE-ONLY</span>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.95]">
            Bolo <span className="text-[#C6FF3D]">&amp;</span> Build
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg sm:text-2xl text-white/80 leading-snug">
            Build something useful for India without typing a line. Speak it into existence with Wispr Flow.
          </p>

          <div className="mt-8 flex justify-center">
            <EventCountdown start={hackathon.startDate} end={hackathon.endDate} />
          </div>

          <div className="mt-8 flex justify-center">
            <VoiceFlowPill />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {open ? (
              <Link
                href={`/hackathons/${slug}/register`}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#C6FF3D] px-7 py-4 text-base font-extrabold text-[#1A1440] shadow-[0_10px_40px_-8px_rgba(198,255,61,0.55)] transition hover:-translate-y-0.5"
              >
                Register free <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={`/hackathons/${slug}/submissions`}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#C6FF3D] px-7 py-4 text-base font-extrabold text-[#1A1440]"
              >
                See the projects <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <a
              href={FLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#B9A7FF] px-7 py-4 text-base font-extrabold text-[#1A1440] transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" /> Get Wispr Flow
            </a>
            <a href="#tracks" className="rounded-2xl border border-white/20 px-7 py-4 text-base font-bold text-white hover:bg-white/10">
              See the 5 tracks
            </a>
            {isAdmin && (
              <Link
                href={`/hackathons/${slug}/admin`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#7C5CFF]/50 bg-[#1A1440] px-3 py-1.5 font-mono text-xs font-bold text-[#C6FF3D]"
              >
                <Shield className="h-3.5 w-3.5" /> ADMIN STUDIO
              </Link>
            )}
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["5 hrs", "of building"],
              ["5", "tracks"],
              [`${hackathon.participantCount}`, "registered"],
              ["Global", "judges"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-2xl font-black text-white">{n}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-white/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hackathon.status === "COMPLETED" && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <WinnersSection certificates={winners} dark hackathonTitle={hackathon.title} />
        </div>
      )}

      {/* HOW IT WORKS */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
        <SectionTitle kicker="How it works" title="Speak. Build. Write it up." />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Mic, t: "1. Speak it", d: "Install Wispr Flow and dictate your prompts to your coding agent. Claude Code, Codex, Cursor, Copilot: your pick." },
            { icon: Hammer, t: "2. Build it", d: "Pick a track and ship a working app for it in about 5 hours. Teams of 1 to 4, any background." },
            { icon: PenLine, t: "3. Write it up", d: "Publish your build log on RepoRally: how you used voice to build, what broke, what you'd tell the next person." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#B9A7FF] text-[#1A1440]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GET WISPR FLOW */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-[#B9A7FF]/30 bg-[#B9A7FF]/10 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="space-y-2">
            <FlowWordmark className="text-xl text-white" />
            <h3 className="text-2xl font-black tracking-tight">Set it up before the day</h3>
            <p className="max-w-xl text-sm leading-relaxed text-white/75">
              Download Wispr Flow, sign in and test it in your editor and your coding agent. Check your free plan's limits too, since you will be dictating a lot all day.
            </p>
          </div>
          <a
            href={FLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#B9A7FF] px-6 py-3.5 text-sm font-extrabold text-[#1A1440]"
          >
            <Download className="h-4 w-4" /> Download Wispr Flow <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* TRACKS */}
      <section id="tracks" className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
        <SectionTitle kicker="Pick a problem" title="Five tracks. One real person in each." />
        <p className="max-w-2xl text-sm leading-relaxed text-white/70">
          Your app does not need voice features. The voice rule is about how you <strong className="text-white">build</strong> it: dictate to your coding agent with Wispr Flow. The phone screens below are just example ideas.
        </p>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {hackathon.tracks.map((t, i) => (
            <div key={t.id} className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition hover:border-[#B9A7FF]/60">
              <div className="space-y-3">
                <TrackVisual id={t.id} />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white/40">TRACK 0{i + 1}</span>
                  <span className="rounded-md bg-[#C6FF3D] px-2 py-0.5 font-mono text-[11px] font-black text-[#1A1440]">{t.prize}</span>
                </div>
                <h3 className="text-xl font-bold leading-snug">{t.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{t.description}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[11px] text-white/60">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RULES + JUDGING */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionTitle kicker="The rules" title="Simple, strict, fair." />
          <ol className="space-y-3">
            {hackathon.rules.map((r, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/80">
                <span className="font-mono text-xs font-black text-[#C6FF3D] pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <SectionTitle kicker="How you're judged" title="What the judges look for" />
          <div className="flex h-3 overflow-hidden rounded-full border border-white/10" aria-hidden>
            {CRITERIA.map((c, i) => (
              <div key={c.label} style={{ width: `${c.pts}%`, background: ["#7C5CFF", "#B9A7FF", "#C6FF3D", "#FFB84D"][i] }} />
            ))}
          </div>
          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">{c.label}</span>
                  <span className="font-mono text-sm font-black text-[#C6FF3D]">{c.pts}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#C6FF3D]" style={{ width: `${c.pts * 3}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/60">{c.note}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/50">Judged by a panel of judges from global companies.</p>
        </div>
      </section>

      {/* BUILD LOG */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid gap-8 rounded-[32px] border border-[#B9A7FF]/30 bg-gradient-to-br from-[#7C5CFF]/25 via-transparent to-[#C6FF3D]/10 p-8 sm:p-12 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#C6FF3D]">Required deliverable</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Publish your build log on RepoRally</h2>
            <p className="text-white/75 leading-relaxed">
              The demo shows what you built. The build log shows how you built it by voice. It's the part other developers will actually read, and it counts toward your score.
            </p>
            <Link href="/write" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#1A1440]">
              Start writing <PenLine className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-white/50">Template</p>
            <ul className="space-y-2.5 text-sm text-white/80">
              {LOG_TEMPLATE.map((x, i) => (
                <li key={x} className="flex gap-3">
                  <span className="font-mono text-xs font-black text-[#C6FF3D] pt-0.5">{i + 1}</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* AWARDS */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
        <SectionTitle kicker="Awards" title="Recognition for how you build, not just what" />
        {/* Podium: 2nd, 1st, 3rd */}
        <div className="grid items-end gap-4 sm:grid-cols-3">
          {[
            { place: "2nd place", note: "Overall runner-up", medal: "linear-gradient(135deg,#F3F5FB,#AEB6CC)", pad: "sm:pt-10", order: "sm:order-1" },
            { place: "1st place", note: "Overall winner", medal: "linear-gradient(135deg,#FFE27A,#E8A91A)", pad: "sm:pt-16", order: "sm:order-2" },
            { place: "3rd place", note: "Overall third", medal: "linear-gradient(135deg,#F0B27A,#B86B2C)", pad: "sm:pt-6", order: "sm:order-3" },
          ].map((m) => (
            <div key={m.place} className={`${m.order} ${m.pad} relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-6 pb-8 pt-8 text-center`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6)]" style={{ background: m.medal }}>
                <Trophy className="h-8 w-8 text-[#1A1440]" />
              </div>
              <div className="text-2xl font-black">{m.place}</div>
              <div className="mt-1 text-sm text-white/60">{m.note}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:col-span-1">
            <div className="mb-3 font-bold">Track winners</div>
            <div className="flex flex-wrap gap-1.5">
              {hackathon.tracks.map((t) => (
                <span key={t.id} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: (TRACK_VIS[t.id]?.accent ?? "#B9A7FF") + "88", color: TRACK_VIS[t.id]?.accent ?? "#B9A7FF" }}>
                  {t.title.split(":")[0]}
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm text-white/60">One winner per track, five in total.</div>
          </div>
          {[
            { name: "Best UI", note: "Honorable mention for teams outside the winners" },
            { name: "Best build log", note: "The write-up other builders most want to read" },
          ].map((a) => (
            <div key={a.name} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-[#C6FF3D]" />
              <div>
                <div className="font-bold">{a.name}</div>
                <div className="text-sm text-white/60">{a.note}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/50">
          Prize details, including any Wispr Flow rewards, will be confirmed on this page. Every finisher gets a RepoRally Builder Passport and certificate.
        </p>
      </section>

      {/* SCHEDULE + VENUE */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <SectionTitle kicker="Saturday 28 Nov" title="The day" />
          <ol className="relative ml-3 border-l border-white/15">
            {hackathon.schedule.map((s) => {
              const key = /Build starts|Submissions close|Awards/.test(s.title);
              return (
                <li key={s.time + s.title} className="relative pb-6 pl-8 last:pb-0">
                  <span
                    className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0B0820] ${key ? "bg-[#C6FF3D] shadow-[0_0_0_4px_rgba(198,255,61,0.18)]" : "bg-[#7C5CFF]"}`}
                  />
                  <div className={`font-mono text-xs font-black ${key ? "text-[#C6FF3D]" : "text-[#B9A7FF]"}`}>{s.time}</div>
                  <div className="mt-0.5 text-lg font-bold leading-snug">{s.title}</div>
                  <div className="text-sm text-white/60">{s.description}</div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="space-y-4">
          <SectionTitle kicker="Where" title="Join from anywhere" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3 text-sm text-white/80">
            <p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#B9A7FF]" /> In person in Hyderabad. Venue announced soon.</p>
            <p className="flex gap-3"><Globe2 className="h-4 w-4 shrink-0 mt-0.5 text-[#B9A7FF]" /> Online: same hours, same rules, same prizes.</p>
            <p className="flex gap-3"><Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#B9A7FF]" /> Times are IST, 10am to 6pm. Registration, building, judging and demos all happen inside that window.</p>
            <p className="flex gap-3"><Mic className="h-4 w-4 shrink-0 mt-0.5 text-[#B9A7FF]" /> Bring a headset with a microphone. Many people will be dictating at once.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bb-reveal mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-8">
        <SectionTitle kicker="Questions" title="FAQ" />
        <div className="grid gap-4 md:grid-cols-2">
          {hackathon.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-bold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bb-reveal mx-auto max-w-4xl px-4 sm:px-6 pb-20 pt-6 text-center space-y-6">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Ready to talk your way to a shipped app?</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {open && (
            <Link
              href={`/hackathons/${slug}/register`}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#C6FF3D] px-8 py-4 text-base font-extrabold text-[#1A1440]"
            >
              Register free <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {submissionsCount > 0 && (
            <Link href={`/hackathons/${slug}/submissions`} className="font-mono text-sm text-[#C6FF3D] underline">
              See submissions ({submissionsCount})
            </Link>
          )}
        </div>
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-white/40">
          Bolo &amp; Build is a community event hosted by RepoRally. Wispr Flow is a trademark of its owner. This page is not an official Wispr announcement, and no sponsorship is implied until confirmed here.
        </p>
      </section>
    </div>
  );
}
