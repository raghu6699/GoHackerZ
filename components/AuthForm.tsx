"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const [done, setDone] = useState(false);

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="relative card shadow-pop-lg p-9">
        {/* corner sticker */}
        <span className="absolute -top-4 -right-3 chip bg-lime rotate-6 shadow-pop-sm">
          {isSignup ? "free forever ✦" : "welcome back 👋"}
        </span>

        <Logo className="mb-6" />

        {done ? (
          <div className="text-center py-6">
            <div className="text-[56px] mb-3">📬</div>
            <h1 className="text-[26px] font-bold mb-2">Check your email</h1>
            <p className="text-muted text-[15px]">
              We sent a magic link to sign you in. (Demo only — no email is
              actually sent.)
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[32px] font-bold leading-tight mb-1">
              {isSignup ? "Join the builders." : "Welcome back."}
            </h1>
            <p className="text-muted text-[15px] mb-7">
              {isSignup
                ? "Create your account and start writing in minutes."
                : "Sign in to keep reading and writing."}
            </p>

            {/* social */}
            <div className="space-y-3 mb-6">
              <button className="btn w-full justify-center">
                <span className="font-bold">GH</span> Continue with GitHub
              </button>
              <button className="btn w-full justify-center">
                <span className="font-bold text-purple">G</span> Continue with
                Google
              </button>
            </div>

            <div className="flex items-center gap-3 my-6">
              <span className="h-[2px] flex-1 bg-[#e2dff2]" />
              <span className="font-mono text-[11px] text-subtle">OR</span>
              <span className="h-[2px] flex-1 bg-[#e2dff2]" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
              className="space-y-3"
            >
              {isSignup && (
                <Field label="NAME" type="text" placeholder="Ada Lovelace" />
              )}
              <Field label="EMAIL" type="email" placeholder="you@company.dev" />
              <Field
                label="PASSWORD"
                type="password"
                placeholder="••••••••"
              />
              <button type="submit" className="btn btn-purple w-full justify-center mt-2">
                {isSignup ? "Create account ✦" : "Sign in →"}
              </button>
            </form>

            <p className="text-center text-[14px] text-muted mt-6">
              {isSignup ? "Already have an account? " : "New to Lore? "}
              <Link
                href={isSignup ? "/signin" : "/signup"}
                className="font-semibold text-purple hover:underline"
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
}: {
  label: string;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] text-subtle font-bold">
        {label}
      </span>
      <input
        type={type}
        required
        placeholder={placeholder}
        className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none shadow-pop-sm focus:shadow-pop transition-shadow bg-card text-ink"
      />
    </label>
  );
}
