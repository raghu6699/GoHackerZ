import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with GoHackerz about pitches, partnerships, and editorial inquiries.",
};

export default function ContactPage() {
  return (
    <div className="wrap max-w-2xl py-10 sm:py-14">
      <div className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Contact</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Say hello.</h1>
        <p className="mt-4 text-lg text-muted">For pitches, partnerships, corrections, and anything worth sending.</p>
        <a href="mailto:hello@gohackerz.com" className="mt-8 inline-flex rounded-full border-2 border-ink bg-lime px-5 py-3 font-bold text-[#1A1440]">hello@gohackerz.com</a>
      </div>
    </div>
  );
}
