import { SITE_URL } from "@/lib/site";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllHackathons } from "@/lib/hackathons";
import { MyPassportBanner } from "@/components/MyPassportBanner";
import { HostHackathonSection } from "@/components/HostHackathonSection";
import { hackathonShareImage } from "@/lib/hackathon-meta";
import { EventCountdown } from "@/components/events/EventCountdown";
import { ArrowRight, Users, Calendar, Clock, Layers, Ticket, Link2, BadgeCheck, PenLine, Rocket, Mic } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Hackathons for Builders: Bolo & Build and More | RepoRally",
  description:
    "Community hackathons on RepoRally. Join Bolo & Build, a one-day voice-only hackathon in Hyderabad and online, build for India, and publish your build log. Free to join, with verifiable certificates.",
  alternates: { canonical: `${SITE_URL}/hackathons` },
  openGraph: {
    type: "website",
    siteName: "RepoRally",
    url: `${SITE_URL}/hackathons`,
    title: "Hackathons for Builders | RepoRally",
    description: "Community hackathons on RepoRally: build, publish your build log, earn verifiable certificates.",
    images: [{ url: `${SITE_URL}/og/bolo-and-build.png`, width: 1200, height: 630, alt: "RepoRally hackathons" }],
  },
  twitter: { card: "summary_large_image", images: [`${SITE_URL}/og/bolo-and-build.png`] },
};

const IST = "Asia/Kolkata";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: false });

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Registration open",
  ACTIVE: "Live now",
  JUDGING: "Judging",
  COMPLETED: "Concluded",
};
const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "bg-lime text-brand-dark",
  ACTIVE: "bg-[#E11D48] text-white",
  JUDGING: "bg-amber-400 text-brand-dark",
  COMPLETED: "bg-purple text-white",
};

const STEPS = [
  { icon: Ticket, title: "Register", text: "Free account, solo or squad. You get a Builder Passport with a scannable verification code." },
  { icon: Mic, title: "Build", text: "Build the project during the event window. Each event sets its own rules and tracks." },
  { icon: PenLine, title: "Publish your build log", text: "Write how you built it on RepoRally. The write-up is part of the entry, and it stays online as an article." },
  { icon: BadgeCheck, title: "Get a verifiable certificate", text: "Participation and award certificates with a public link anyone can use to check them." },
];

export default async function HackathonsPage() {
  const hackathons = await getAllHackathons();
  const featured =
    hackathons.find((h) => h.status === "ACTIVE") ||
    hackathons.find((h) => h.status === "UPCOMING") ||
    hackathons[0];
  const others = hackathons.filter((h) => h.slug !== featured?.slug);
  const registered = hackathons.reduce((acc, h) => acc + (h.participantCount || 0), 0);
  const fImage = featured ? hackathonShareImage(featured) : null;
  const fOpen = featured && (featured.status === "UPCOMING" || featured.status === "ACTIVE");

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-6xl mx-auto space-y-12 sm:space-y-16">
        {featured && <MyPassportBanner slug={featured.slug} hackathonId={featured.id} />}

        {/* Hero */}
        <section className="relative overflow-hidden bg-brand-dark text-white rounded-3xl p-7 sm:p-14 border-2 border-ink shadow-pop-xl">
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C6FF3D_1px,transparent_1px)] [background-size:24px_24px]" aria-hidden />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/15 border border-lime text-lime font-mono text-[12px] font-bold tracking-wider">
              {featured?.status === "ACTIVE" && <span className="w-2.5 h-2.5 rounded-full bg-lime animate-ping" />}
              <span>REPORALLY HACKATHONS</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Build in a day. <br />
              <span className="text-lime">Publish how you did it.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#D4CEF5] leading-relaxed max-w-2xl">
              Free community hackathons where the write-up counts as much as the build. Register, ship a project, publish your build log on RepoRally, and earn a certificate anyone can verify.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {featured && (
                <Link
                  href={`/hackathons/${featured.slug}`}
                  className="btn btn-lime text-brand-dark font-extrabold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop flex items-center gap-2 group"
                >
                  <span>{fOpen ? `Join ${featured.title}` : `See ${featured.title}`}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <a
                href="#host-a-hackathon"
                className="btn bg-purple text-white hover:bg-purple-dark font-bold text-[15px] px-6 py-3.5 rounded-2xl shadow-pop border-2 border-ink"
              >
                Host a hackathon
              </a>
            </div>
          </div>
        </section>

        {/* Featured event */}
        {featured && fImage && (
          <section aria-labelledby="featured-heading" className="space-y-5">
            <h2 id="featured-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">
              {featured.status === "COMPLETED" ? "Latest event" : "Next up"}
            </h2>
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-0 overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-pop-lg">
              <Link href={`/hackathons/${featured.slug}`} className="flex items-center bg-brand-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fImage.url} alt={fImage.alt} width={1200} height={630} className="h-auto w-full" />
              </Link>
              <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                <div className="space-y-4">
                  <span className={`inline-block px-2.5 py-0.5 font-mono text-[11px] font-extrabold rounded-md ${STATUS_STYLE[featured.status]}`}>
                    {STATUS_LABEL[featured.status]}
                  </span>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-ink">{featured.title}</h3>
                    <p className="mt-2 text-body leading-relaxed">{featured.tagline}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-body">
                    <li className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-purple" />{fmtDate(featured.startDate)}</li>
                    <li className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-purple" />{fmtTime(featured.startDate)} to {fmtTime(featured.endDate)} IST</li>
                    {featured.tracks.length > 0 && (
                      <li className="flex items-center gap-2.5"><Layers className="h-4 w-4 text-purple" />{featured.tracks.length} tracks</li>
                    )}
                    {featured.participantCount > 0 && (
                      <li className="flex items-center gap-2.5"><Users className="h-4 w-4 text-purple" />{featured.participantCount} registered so far</li>
                    )}
                  </ul>
                  {featured.status === "UPCOMING" && (
                    <div className="rounded-2xl bg-brand-dark p-4 flex justify-center">
                      <EventCountdown start={featured.startDate} end={featured.endDate} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {fOpen ? (
                    <Link href={`/hackathons/${featured.slug}/register`} className="btn btn-lime text-brand-dark font-extrabold px-5 py-3 rounded-2xl shadow-sm">
                      Register free
                    </Link>
                  ) : (
                    <Link href={`/hackathons/${featured.slug}/submissions`} className="btn btn-lime text-brand-dark font-extrabold px-5 py-3 rounded-2xl shadow-sm">
                      See submissions
                    </Link>
                  )}
                  <Link href={`/hackathons/${featured.slug}`} className="btn bg-bg text-ink border border-ink/20 font-bold px-5 py-3 rounded-2xl">
                    Event details
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">How a RepoRally hackathon works</h2>
            <p className="text-body text-sm sm:text-base">Four steps, from signing up to a certificate you can show anyone.</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((st, i) => (
              <li key={st.title} className="bg-card border-2 border-ink rounded-2xl p-5 shadow-pop-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple/15 border border-purple/40 flex items-center justify-center text-purple">
                    <st.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-subtle">0{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-ink">{st.title}</h3>
                <p className="text-sm text-body leading-relaxed">{st.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* More events */}
        <section id="all-hackathons" className="space-y-6 scroll-mt-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {others.length > 0 ? "More hackathons" : "What's next"}
            </h2>
            {registered > 0 && (
              <span className="font-mono text-xs text-subtle">{registered} builder{registered !== 1 ? "s" : ""} registered across events</span>
            )}
          </div>
          {others.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {others.map((h) => (
                <Link
                  key={h.id || h.slug}
                  href={`/hackathons/${h.slug}`}
                  className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-8 space-y-3 transition-all hover:-translate-y-1 hover:border-purple"
                >
                  <span className={`inline-block px-2.5 py-0.5 font-mono text-[11px] font-extrabold rounded-md ${STATUS_STYLE[h.status]}`}>
                    {STATUS_LABEL[h.status]}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">{h.title}</h3>
                  <p className="text-sm text-body line-clamp-2 leading-relaxed">{h.tagline || h.description}</p>
                  <div className="font-mono text-[11px] text-muted">{fmtDate(h.startDate)}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-ink/25 bg-card p-8 sm:p-10 text-center space-y-3">
              <p className="text-lg font-bold text-ink">More hackathons are on the way.</p>
              <p className="text-body text-sm max-w-xl mx-auto">
                Bolo &amp; Build is our first. If you run a community, company or college and want to host one on RepoRally, send us a proposal below.
              </p>
            </div>
          )}
        </section>

        {/* What you get */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">What you get</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <Ticket className="w-6 h-6 text-purple" />
              <h3 className="font-bold text-lg text-ink">A Builder Passport</h3>
              <p className="text-sm text-body leading-relaxed">A personal pass for each event with a scannable QR code and a theme you pick, ready to share.</p>
            </div>
            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <Link2 className="w-6 h-6 text-purple" />
              <h3 className="font-bold text-lg text-ink">Link-only submissions</h3>
              <p className="text-sm text-body leading-relaxed">No large uploads. Submit your repo, a live link and an optional demo or deck.</p>
            </div>
            <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-pop-sm space-y-3">
              <Rocket className="w-6 h-6 text-purple" />
              <h3 className="font-bold text-lg text-ink">A public build log</h3>
              <p className="text-sm text-body leading-relaxed">Your write-up lives on RepoRally as a real article under your profile, long after the event ends.</p>
            </div>
          </div>
        </section>

        <HostHackathonSection />
      </div>
    </div>
  );
}
