"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ slug }: { slug: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function act(action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/review/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert((await res.json()).error ?? "Failed");
      }
    } finally {
      setBusy(false);
      setRejecting(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      {!rejecting ? (
        <div className="flex gap-2">
          <button onClick={() => act("approve")} disabled={busy} className="btn btn-sm btn-purple">
            ✓ Approve
          </button>
          <button onClick={() => setRejecting(true)} disabled={busy} className="btn btn-sm">
            ✕ Reject…
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="What should the author fix?"
            className="w-full border-2 border-ink rounded-xl px-3 py-2 text-[13px] outline-none bg-card"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRejecting(false)} className="btn btn-sm" disabled={busy}>
              Cancel
            </button>
            <button
              onClick={() => act("reject")}
              disabled={busy || !feedback.trim()}
              className="btn btn-sm bg-peach text-[#1A1440] disabled:opacity-40"
            >
              Send rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}