"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase-browser");
      const supabase = createClient();
      if (!supabase) throw new Error("Auth isn't configured in this environment.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="card shadow-pop-lg p-5 sm:p-9">
        {done ? (
          <div className="text-center py-6">
            <div className="text-[56px] mb-3">✅</div>
            <h1 className="text-[26px] font-bold mb-2">Password updated</h1>
            <Link href="/" className="btn btn-purple mt-4 inline-flex">
              Back to feed →
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[30px] font-bold mb-2">Set a new password</h1>
            <p className="text-muted text-[15px] mb-7">
              Choose something strong — 6 characters minimum.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="font-mono text-[11px] text-subtle font-bold">NEW PASSWORD</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none shadow-pop-sm bg-card text-ink"
                />
              </label>
              {error && (
                <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-3 py-2 text-[#8a2b00]">
                  ⚠ {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-purple w-full justify-center disabled:opacity-50">
                {busy ? "Updating…" : "Update password ✦"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}