import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn what GoHackerz is, who we are, and why we publish engineering writing.",
};

export default function AboutPage() {
  return (
    <div className="wrap max-w-4xl py-10 sm:py-14">
      <article className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">About</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">GoHackerz publishes the essays that engineering teams actually need.</h1>

        <p className="mt-6 text-lg leading-relaxed text-muted">
          We are a publication for engineers who are tired of hype cycles and polished-but-useless product writing. We favor durable lessons: architecture trade-offs, incident reports, tuning work, AI systems, and the daily realities of building software at scale.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border-2 border-ink bg-[#17132a] p-5 text-white">
            <h2 className="text-xl font-bold">Our mission</h2>
            <p className="mt-3 text-[#ded8ff]">
              To help engineers think clearly, write concretely, and ship with more judgment.
            </p>
          </section>

          <section className="rounded-2xl border-2 border-ink bg-lime p-5 text-[#1A1440]">
            <h2 className="text-xl font-bold">What we value</h2>
            <p className="mt-3 font-medium">
              Practicality, honesty, measurement, and craft over trend-chasing.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold">The team</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink bg-[#f3f0ff] p-5 text-[#1A1440]">
              <div className="font-bold">Maya Krishnan</div>
              <div className="mt-1 font-mono text-xs uppercase text-subtle">Editor in chief</div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-[#f3f0ff] p-5 text-[#1A1440]">
              <div className="font-bold">Jordan Tao</div>
              <div className="mt-1 font-mono text-xs uppercase text-subtle">Database editor</div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border-2 border-ink bg-card p-5">
          <h2 className="text-2xl font-bold">Contact</h2>
          <p className="mt-3 text-muted">hello@gohackerz.com</p>
          <p className="mt-2 text-muted">For pitches, partnerships, and corrections.</p>
        </div>
      </article>
    </div>
  );
}
