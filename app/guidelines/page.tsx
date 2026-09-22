import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, ShieldCheck, PenTool, Sparkles, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Writer Guidelines — GoHackerz",
  description: "Editorial standards, topic scope, tone guidelines, and submission workflow for writing on GoHackerz.",
};

export default function GuidelinesPage() {
  return (
    <div className="wrap max-w-4xl py-10 sm:py-14">
      <article className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">
            Editorial Standards
          </div>
          <Link href="/write" className="btn btn-purple btn-sm">
            <span>Open Editor</span> <PenTool className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          GoHackerz Writer Guidelines
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          GoHackerz is a platform for engineers who build and ship software in the real world. We publish essays that technical practitioners bookmark, share, and reference during architectural discussions.
        </p>

        {/* Core Principles Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-[#17132a] p-5 text-white">
            <div className="flex items-center gap-2 text-lime font-bold text-lg">
              <Terminal className="w-5 h-5" />
              <span>Practitioner First</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#ded8ff]">
              Write like an engineer sharing lessons with peers. We favor concrete code examples, system architecture diagrams, and real-world numbers over high-level marketing fluff.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-lime p-5 text-[#1A1440]">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Sparkles className="w-5 h-5 text-purple" />
              <span>Durable Insights</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed font-medium">
              We look for timeless engineering lessons—why a specific data structure was chosen, how a production bottleneck was diagnosed, or trade-offs between monoliths and microservices.
            </p>
          </div>
        </div>

        {/* Section 1: What We Publish */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple" />
            <span>1. Topics We Publish</span>
          </h2>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "Production Incident Reviews & Postmortems",
                desc: "Honest write-ups detailing root causes, latency spikes, database locks, memory leaks, and how they were fixed.",
              },
              {
                title: "Architecture & System Design",
                desc: "Deep-dives into trade-offs: why you migrated off or onto PostgreSQL, microservices vs. monoliths, caching strategies, or message queue setups.",
              },
              {
                title: "Performance Optimization & Tuning",
                desc: "Flamegraphs, garbage collection tuning, query optimization, kernel parameters, or memory alignment in Rust/Go/C++.",
              },
              {
                title: "AI Systems & Infrastructure",
                desc: "Building LLM agents, vector database indexing, GPU cluster management, model quantization, and production AI pipelines.",
              },
              {
                title: "Developer Tooling & Language Craft",
                desc: "Building compilers, linters, CLI tools, custom runtimes, or advanced language features used effectively at scale.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533] hover:border-purple transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-purple shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-ink dark:text-white text-base">{item.title}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Tone & Formatting Requirements */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple" />
            <span>2. Quality & Formatting Checklist</span>
          </h2>
          <div className="mt-4 rounded-2xl border-2 border-ink bg-card p-6 space-y-4 text-muted">
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">01.</span>
              <div>
                <strong className="text-ink dark:text-white">Clear Heading Structure:</strong> Use logical Markdown headings (<code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">##</code> for main sections, <code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">###</code> for sub-topics).
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">02.</span>
              <div>
                <strong className="text-ink dark:text-white">Syntax-Highlighted Code Blocks:</strong> Wrap code in triple backticks with language specifiers (e.g. <code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">```typescript</code>, <code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">```rust</code>, <code className="text-xs bg-bg px-1.5 py-0.5 rounded font-mono">```go</code>).
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">03.</span>
              <div>
                <strong className="text-ink dark:text-white">No AI Sludge or Clickbait:</strong> Articles generated by raw AI prompts without real engineering context will be rejected during review.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">04.</span>
              <div>
                <strong className="text-ink dark:text-white">Measurements & Data:</strong> Include benchmarks, memory footprints, or response time metrics whenever making performance claims.
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <div className="mt-10 rounded-2xl border-2 border-ink bg-brand-dark p-6 sm:p-8 text-white text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to publish your essay?</h2>
          <p className="mt-2 text-[#D4CEF5] max-w-xl text-sm sm:text-base">
            Draft your article in our distraction-free Markdown editor. Once submitted, your article enters our editorial review queue.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link href="/write" className="btn btn-lime text-[#1A1440]">
              Start Writing Now ✎
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
