"use client";

import { useState } from "react";

export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "lime";
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 font-semibold">
        <span className="grid place-items-center w-10 h-10 rounded-xl border-2 border-ink bg-lime shadow-pop-sm">
          ✓
        </span>
        You&apos;re in — check your inbox on Friday. ✦
      </div>
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
        className="border-2 border-ink rounded-xl px-4 py-3 font-mono text-[14px] min-w-[220px] shadow-pop outline-none bg-card text-ink"
      />
      <button type="submit" className={`btn ${variant === "lime" ? "btn-purple" : "btn-lime"}`}>
        Subscribe →
      </button>
    </form>
  );
}
