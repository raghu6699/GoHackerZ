import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Eye, Lock, Database, UserCheck, Mail, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — GoHackerz",
  description: "Learn how GoHackerz collects, uses, and protects your personal information and developer data.",
};

export default function PrivacyPage() {
  return (
    <div className="wrap max-w-4xl py-10 sm:py-14">
      <article className="rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg sm:p-10">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">
            Legal & Trust
          </div>
          <Link href="/" className="btn btn-ghost btn-sm text-xs font-mono">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl flex items-center gap-3">
          <Shield className="w-9 h-9 sm:w-11 sm:h-11 text-purple shrink-0" />
          <span>Privacy Policy</span>
        </h1>
        <p className="mt-4 text-sm font-mono text-muted">
          Last updated: October 2026 · Effective immediately
        </p>

        <p className="mt-4 text-lg leading-relaxed text-muted">
          At GoHackerz, we respect the privacy of developers, writers, and hackers. We believe in privacy by design, minimal data collection, and absolute transparency about how your data is handled.
        </p>

        {/* Highlight Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-[#17132a] p-5 text-white">
            <div className="flex items-center gap-2 text-lime font-bold text-lg">
              <Eye className="w-5 h-5" />
              <span>Zero Surveillance</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#ded8ff]">
              We do not sell your personal data, track you across the web, or build advertising profiles. Our analytics are strictly privacy-preserving.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-lime p-5 text-[#1A1440]">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Lock className="w-5 h-5 text-purple" />
              <span>Full Data Ownership</span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed font-medium">
              You own your published technical articles, draft content, and profile details. You can request deletion or export of your account data at any time.
            </p>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-purple" />
            <span>1. Information We Collect</span>
          </h2>
          <div className="mt-4 space-y-3">
            <div className="p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533]">
              <h3 className="font-bold text-ink dark:text-white text-base">Account & Profile Information</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                When you register via OAuth (GitHub, Google) or email, we collect basic details such as your username, display name, email address, avatar URL, bio, and social links (Twitter/GitHub).
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533]">
              <h3 className="font-bold text-ink dark:text-white text-base">Content & Submissions</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                Articles, technical breakdowns, draft posts, guestbook signatures, hackathon tickets, and comments you publish or submit to GoHackerz are stored securely on our database servers.
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-ink/15 bg-bg/50 dark:bg-[#1a1533]">
              <h3 className="font-bold text-ink dark:text-white text-base">Privacy-Preserving Telemetry</h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                To evaluate article popularity and performance, we record aggregated page views and referral sources using hashed, anonymized session identifiers without cross-site tracking cookies.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How We Use Information */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple" />
            <span>2. How We Use Your Data</span>
          </h2>
          <div className="mt-4 rounded-2xl border-2 border-ink bg-card p-6 space-y-4 text-muted">
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">01.</span>
              <div>
                <strong className="text-ink dark:text-white">Platform Operation:</strong> Delivering core services, rendering writer profiles, processing article submissions, and generating Hacker Passports for events.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">02.</span>
              <div>
                <strong className="text-ink dark:text-white">Account Security & Authentication:</strong> Verifying identity via Supabase Auth and preventing abuse or unauthorized account access.
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-purple">03.</span>
              <div>
                <strong className="text-ink dark:text-white">Community & Operational Communications:</strong> Sending essential system notifications, transactional messages, or updates regarding hackathon participation.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Protection & Third Parties */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple" />
            <span>3. Infrastructure & Third-Party Services</span>
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            We rely on trusted cloud infrastructure providers that adhere to industry-leading security standards:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 text-sm text-muted">
            <li><strong className="text-ink dark:text-white">Supabase:</strong> Managed database, authentication, and encrypted storage for account records and content.</li>
            <li><strong className="text-ink dark:text-white">Vercel:</strong> Global CDN and edge hosting infrastructure delivering high performance and SSL protection.</li>
          </ul>
        </section>

        {/* Section 4: Contact & Data Control */}
        <div className="mt-10 rounded-2xl border-2 border-ink bg-brand-dark p-6 sm:p-8 text-white text-center flex flex-col items-center">
          <Mail className="w-8 h-8 text-lime mb-2" />
          <h2 className="text-2xl font-bold">Questions about your privacy?</h2>
          <p className="mt-2 text-[#D4CEF5] max-w-xl text-sm sm:text-base">
            For account deletion requests, data export requests, or privacy inquiries, contact our team at:
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
