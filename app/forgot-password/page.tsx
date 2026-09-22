"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      // Also trigger Supabase client reset as backup
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          });
        }
      } catch {
        // ignore client error if API succeeded
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="card shadow-pop-lg p-5 sm:p-9">
        {sent ? (
          <div className="text-center py-6">
            <div className="text-[56px] mb-3">📬</div>
            <h1 className="text-[26px] font-bold mb-2">Check your email</h1>
            <p className="text-muted text-[15px]">
              If an account exists for {email}, a reset link is on its way.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[30px] font-bold mb-2">Forgot password?</h1>
            <p className="text-muted text-[15px] mb-7">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="font-mono text-[11px] text-subtle font-bold">EMAIL</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.dev"
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none shadow-pop-sm bg-card text-ink"
                />
              </label>
              {error && (
                <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-3 py-2 text-[#8a2b00]">
                  ⚠ {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-purple w-full justify-center disabled:opacity-50">
                {busy ? "Sending…" : "Send reset link →"}
              </button>
            </form>
            <p className="text-center text-[14px] text-muted mt-6">
              <Link href="/signin" className="font-semibold text-purple hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}