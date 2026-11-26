import type { Metadata } from "next";
import Link from "next/link";
import { getUserCount } from "@/lib/queries";
import { formatCount } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Advertise",
  description: "Sponsor RepoRally: reach developers, technical writers and hackathon builders, with a monthly report of views and clicks.",
  alternates: { canonical: "/advertise" },
};

const CONTACT = "hi@loratechsolutions.com";
const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent("Advertising on RepoRally")}`;

const OPTIONS = [
  {
    name: "Partner banner",
    what: "A full-width banner on the homepage with your logo, headline, short pitch and a button. One partner at a time.",
  },
  {
    name: "Sponsored card",
    what: "A card beside the homepage story list with your logo, headline and link. Good for a product, a launch or open roles.",
  },
  {
    name: "Hackathon sponsorship",
    what: "Your logo on a hackathon page, a prize or opportunity for the winners, and a mention to everyone who registers.",
  },
];

const PROMISES = [
  "Every placement is clearly labelled Sponsored.",
  "You get a monthly report: views (counted only when at least half of the ad is on screen), clicks and click-through rate. Bots are excluded.",
  "Links carry UTM tags (utm_source=reporally), so the visits show up in your own analytics too.",
  "Links are marked rel=\"sponsored\", as search engines require for paid links.",
];

export default async function AdvertisePage() {
  const members = await getUserCount();

  return (
    <div className="wrap max-w-3xl py-10 sm:py-14 space-y-8">
      <div className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Advertise</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Put your company in front of builders.</h1>
        <p className="mt-4 text-lg text-muted">
          RepoRally is where developers write about what they build and compete in hackathons. Sponsor the site or an event to reach them.
          {members > 0 && <> {formatCount(members)} members have signed up so far.</>}
        </p>
        <a href={mailto} className="mt-8 inline-flex rounded-full border-2 border-ink bg-lime px-5 py-3 font-bold text-[#1A1440]">
          Email {CONTACT}
        </a>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Options</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <div key={o.name} className="rounded-2xl border-2 border-ink bg-card p-5">
              <h3 className="font-bold text-lg mb-2">{o.name}</h3>
              <p className="text-sm text-muted leading-relaxed">{o.what}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-ink bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">What every sponsor gets</h2>
        <ul className="space-y-2 text-muted">
          {PROMISES.map((p) => <li key={p} className="flex gap-2"><span className="text-purple font-bold">✓</span><span>{p}</span></li>)}
        </ul>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-ink/40 p-6">
        <h2 className="text-xl font-bold mb-2">Pricing</h2>
        <p className="text-muted">
          Placements are booked by the month. Email us with what you want to promote and when, and we will send the price and the current audience numbers. See our <Link href="/privacy" className="underline">privacy policy</Link> for how we measure.
        </p>
      </section>
    </div>
  );
}
