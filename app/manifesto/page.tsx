import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto",
  description: "The principles behind GoHackerz and the engineering writing we believe in.",
};

export default function ManifestoPage() {
  return (
    <div className="wrap max-w-3xl py-10 sm:py-14">
      <article className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Manifesto</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Ship the real story.</h1>

        <p className="mt-6 text-lg leading-relaxed text-muted">
          We believe the best engineering writing is honest, specific, and useful. It tells the truth about trade-offs, explains the cost of choices, and leaves the reader with a sharper model of the system they are building. Good engineering writing is not a product pitch, a self-congratulatory recap, or a recycled conference talk. It is the hard-earned wisdom of people who have been in the room when the system failed, changed, or finally clicked.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-muted">
          We publish essays that value measurement over vibes, craft over buzzwords, and clarity over cleverness. We are interested in how software actually gets shipped, maintained, and improved over years — not in the polished myth of the perfect technical debut.
        </p>
      </article>
    </div>
  );
}
