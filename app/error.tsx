"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="wrap max-w-[560px] py-20 text-center">
      <div className="text-[56px] mb-3">⚠️</div>
      <h1 className="text-[32px] font-bold mb-3">Something broke on the wire</h1>
      <p className="text-[16px] text-muted mb-6">
        An unexpected exception occurred while rendering this view.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="btn btn-purple"
          type="button"
        >
          Try again ↻
        </button>
        <Link href="/" className="btn">
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
