"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "client.global_error",
        message: error.message,
        digest: error.digest,
      })
    );
  }, [error]);
  return (
    <html lang="en">
      <body className="bg-[#EEF1FF] text-[#1A1440] font-sans antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-[480px] w-full bg-white border-2 border-[#1A1440] rounded-2xl p-8 text-center shadow-[6px_6px_0_#1A1440]">
          <div className="text-[48px] mb-3">🛠️</div>
          <h1 className="text-[28px] font-bold mb-2">Application Error</h1>
          <p className="text-[15px] text-[#565080] mb-6">
            A critical error occurred. Please reload or return to safety.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center font-semibold text-[15px] border-2 border-[#1A1440] rounded-xl px-4 py-2.5 bg-[#7C5CFF] text-white shadow-[3px_3px_0_#1A1440]"
            >
              Reload application
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center font-semibold text-[15px] border-2 border-[#1A1440] rounded-xl px-4 py-2.5 bg-white text-[#1A1440] shadow-[3px_3px_0_#1A1440]"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
