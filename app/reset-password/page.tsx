"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-ink rounded-xl px-4 py-3 pr-10 text-[15px] outline-none shadow-pop-sm bg-card text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-ink transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-muted hover:text-purple" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 text-muted hover:text-purple" />
                    )}
                  </button>
                </div>
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