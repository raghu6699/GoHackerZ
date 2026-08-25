"use client";

import { useState } from "react";

export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "lime" | "card";
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 font-semibold">
        <span className="grid place-items-center w-10 h-10 rounded-xl border-2 border-ink bg-lime shadow-pop-sm">
          ✓
        </span>
        You're in — check your inbox on Friday. ✦
      </div>
    );
  }

  // "card": stacked layout for narrow sidebar placement
  if (variant === "card") {
    return (
      <form onSubmit={onSubmit} className="card p-5 space-y-3">
        <div className="font-bold text-[16px]">The Weekly Compile ✦</div>
        <p className="text-[13px] leading-relaxed text-muted">
          Five sharp reads every Friday. No spam.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.dev"
          className="w-full border-2 border-ink rounded-xl px-4 py-2.5 font-mono text-[13px] shadow-pop-sm outline-none bg-card text-ink"
        />
        <button type="submit" className="btn btn-sm btn-purple w-full">
          Subscribe →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.dev"
        className="border-2 border-ink rounded-xl px-4 py-3 font-mono text-[14px] w-full sm:w-auto sm:min-w-[220px] shadow-pop outline-none bg-card text-ink"
      />
      <button type="submit" className={`btn ${variant === "lime" ? "btn-purple" : "btn-lime"}`}>
        Subscribe →
      </button>
    </form>
  );
}