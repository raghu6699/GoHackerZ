import type { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText, Code, Trophy, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — GoHackerz",
  description: "Terms and conditions governing the use of GoHackerz platform, publication, hackathons, and developer tools.",
};

export default function TermsPage() {
  return (
    <div className="wrap max-w-4xl py-10 sm:py-14">
      <article className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">
            Legal & Governance
          </div>
          <Link href="/" className="btn btn-ghost btn-sm text-xs font-mono">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
          <Scale className="w-9 h-9 sm:w-11 sm:h-11 text-purple shrink-0" />
          <span>Terms of Service</span>
        </h1>
        <p className="mt-4 text-sm font-mono text-muted">
          Last updated: October 2026 · Effective immediately
        </p>

        <p className="mt-4 text-lg leading-relaxed text-muted">
          Welcome to GoHackerz. By accessing our platform, creating an account, publishing engineering content, or participating in GoHackerz hackathons, you agree to comply with and be bound by these Terms of Service.
        </p>

        {/* Core Terms Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-[#17132a] p-5 text-white">
            <div className="flex items-center gap-2 text-lime font-bold text-lg">
              <Code className="w-5 h-5" />
              <span>Author Ownership</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#ded8ff]">
              You retain full ownership and copyright of the original code, essays, and diagrams you write and publish on GoHackerz.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-lime p-5 text-[#1A1440]">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Trophy className="w-5 h-5 text-purple" />
              <span>Fair Competition</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed font-medium">
              Hackathon entries must represent real software built according to event guidelines and timelines. Plagiarism or fraudulent claims lead to instant disqualification.
            </p>
          </div>
        </div>

        {/* Section 1: User Accounts & Eligibility */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple" />
            <span>1. User Accounts & Responsibilities</span>
          </h2>
          <div className="mt-4 space-y-3">
            <div className="p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533]">
              <h3 className="font-bold text-ink dark:text-white text-base">Account Security</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                You are responsible for maintaining the security of your account credentials and OAuth tokens. Any action taken under your account is your responsibility.
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533]">
              <h3 className="font-bold text-ink dark:text-white text-base">Acceptable Use</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                You agree not to use GoHackerz to distribute malware, post spam, perform unauthorized automated scraping, harass community members, or violate intellectual property rights.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Content Rights & Publishing License */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-purple" />
            <span>2. Content Publishing & Licensing</span>
          </h2>
          <div className="mt-4 rounded-2xl border-2 border-ink bg-card p-6 space-y-4 text-muted">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink dark:text-white">Non-Exclusive License:</strong> By publishing on GoHackerz, you grant us a non-exclusive, worldwide, royalty-free license to host, display, index, and distribute your content across our web platform and RSS feeds.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink dark:text-white">Editorial Quality & Moderation:</strong> GoHackerz reserves the right to unpublish, edit formatting of, or refuse content that fails our editorial standards or violates community rules.
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink dark:text-white">Code Snippets:</strong> Code snippets included in articles are assumed to be provided under open-source MIT license principles unless explicitly specified otherwise by the author.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Hackathons & Events */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple" />
            <span>3. Hackathons & Hacker Passports</span>
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            GoHackerz hosts virtual and in-person hackathons. By registering for a hackathon:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 text-sm text-muted">
            <li>You agree to submit original projects built within the event timeframe.</li>
            <li>GoHackerz issues digital Hacker Passports and tickets for verified participants. Passports are non-transferable certificates of participation or victory.</li>
            <li>Judge decisions on prize awards, track placements, and honorable mentions are final.</li>
          </ul>
        </section>

        {/* Section 4: Limitation of Liability */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-purple" />
            <span>4. Disclaimers & Limitation of Liability</span>
          </h2>
          <div className="mt-4 p-5 rounded-2xl border-2 border-ink bg-bg/50 dark:bg-[#1a1533] text-sm text-muted leading-relaxed">
            GoHackerz is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Code samples and technical architectures published by authors are shared for educational purposes. GoHackerz is not liable for production downtime, code bugs, or lost data resulting from the implementation of technical advice contained in published essays.
          </div>
        </section>

        {/* Section 5: Contact */}
        <div className="mt-10 rounded-2xl border-2 border-ink bg-brand-dark p-6 sm:p-8 text-white text-center flex flex-col items-center">
          <h2 className="text-2xl font-bold">Contact & Legal Enquiries</h2>
          <p className="mt-2 text-[#D4CEF5] max-w-xl text-sm sm:text-base">
            For questions regarding these Terms of Service or copyright issues, please reach out to:
          </p>
          <a
            href="mailto:hello@gohackerz.com"
            className="mt-4 btn btn-lime text-[#1A1440] font-mono font-bold"
          >
            hello@gohackerz.com
          </a>
        </div>
      </article>
    </div>
  );
}
