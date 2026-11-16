import Link from "next/link";
import type { HackathonData } from "@/lib/hackathons";
import { VoiceFlowPill } from "./VoiceFlowPill";
import { MyPassportBanner } from "@/components/MyPassportBanner";
const FLOW_URL = "https://wisprflow.ai";

import { Download, ExternalLink, ArrowRight, Mic, Hammer, PenLine, Shield, Trophy, Clock, MapPin, Globe2 } from "lucide-react";

const CRITERIA = [
  { label: "Impact and usefulness", pts: 30, note: "Does it solve a real problem for real people?" },
  { label: "Working demo", pts: 25, note: "It runs, it's clear, and judges can try it." },
  { label: "Build log quality", pts: 25, note: "The voice process, the mistakes and the lessons." },
  { label: "UX and UI", pts: 20, note: "Clear, accessible and pleasant to use." },
];

const AWARDS = [
  { name: "1st place", note: "Overall winner" },
  { name: "2nd place", note: "Overall runner-up" },
  { name: "3rd place", note: "Overall third" },
  { name: "Track winners", note: "One per track, five in total" },
  { name: "Best UI", note: "Honorable mention for teams outside the winners" },
  { name: "Best build log", note: "The write-up other builders most want to read" },
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
}: {
  hackathon: HackathonData;
  isAdmin: boolean;
  submissionsCount: number;
}) {
  const slug = hackathon.slug;
  const open = hackathon.status !== "COMPLETED" && hackathon.status !== "JUDGING";

  return (
    <div className="bg-[#0B0820] text-white">
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

          <div className="mt-10 flex justify-center">
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

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
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
      <section id="tracks" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
        <SectionTitle kicker="Pick a problem" title="Five tracks. One real person in each." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {hackathon.tracks.map((t, i) => (
            <div key={t.id} className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition hover:border-[#B9A7FF]/60">
              <div className="space-y-3">
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-2">
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-10">
        <SectionTitle kicker="Awards" title="Recognition for how you build, not just what" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AWARDS.map((a) => (
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <SectionTitle kicker="Saturday 28 Nov" title="The day" />
          <div className="space-y-2.5">
            {hackathon.schedule.map((s) => (
              <div key={s.time + s.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="w-24 shrink-0 font-mono text-xs font-black text-[#C6FF3D] pt-0.5">{s.time}</span>
                <div>
                  <div className="font-bold">{s.title}</div>
                  <div className="text-sm text-white/60">{s.description}</div>
                </div>
              </div>
            ))}
          </div>
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-8">
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
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 pt-6 text-center space-y-6">
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
