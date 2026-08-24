"use client";

import { useState } from "react";

/** Copy-to-clipboard for published code blocks. Invisible until needed. */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (http, permissions) — button just does nothing */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy code"
      aria-label="Copy code to clipboard"
      className={`absolute top-2 right-2 z-10 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border-2 border-ink transition-colors cursor-pointer ${
        copied
          ? "bg-lime text-[#1A1440]"
          : "bg-card text-ink hover:bg-bg opacity-70 hover:opacity-100"
      }`}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}
