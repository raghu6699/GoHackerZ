"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "./Logo";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Which OAuth providers are enabled on the Supabase project (from /auth/v1/settings)
  const [enabledProviders, setEnabledProviders] = useState<{
    github: boolean;
    google: boolean;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => r.json())
      .then((s) =>
        setEnabledProviders({
          github: !!s?.external?.github,
          google: !!s?.external?.google,
        })
      )
      .catch(() => setEnabledProviders({ github: false, google: false }));
  }, []);

  async function syncProfile() {
    // Best effort: create/refresh the matching public.User row via Prisma
    try {
      await fetch("/api/auth/sync", { method: "POST" });
    } catch {
      // non-fatal — session is already valid
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data.session) {
        // Email confirmation is enabled — user must click the link first
        setDone(true);
        setLoading(false);
        return;
      }
      await syncProfile();
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Wrong email or password."
            : error.message
        );
        setLoading(false);
        return;
      }
      await syncProfile();
      router.push("/");
      router.refresh();
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setError(null);

    if (enabledProviders && !enabledProviders[provider]) {
      const label = provider === "github" ? "GitHub" : "Google";
      setError(
        `${label} sign-in isn't enabled on this Supabase project yet. ` +
          "Enable it in Supabase Dashboard → Authentication → Sign In / Providers."
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="relative card shadow-pop-lg p-5 sm:p-9">
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
              We sent a confirmation link to your email. Click it to activate
              your account, then sign in.
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
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className={`btn w-full justify-center ${
                  enabledProviders && !enabledProviders.github
                    ? "opacity-50"
                    : ""
                }`}
              >
                <span className="font-bold">GH</span> Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className={`btn w-full justify-center ${
                  enabledProviders && !enabledProviders.google
                    ? "opacity-50"
                    : ""
                }`}
              >
                <span className="font-bold text-purple">G</span> Continue with
                Google
              </button>
            </div>

            <div className="flex items-center gap-3 my-6">
              <span className="h-[2px] flex-1 bg-[#e2dff2]" />
              <span className="font-mono text-[11px] text-subtle">OR</span>
              <span className="h-[2px] flex-1 bg-[#e2dff2]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <Field label="NAME" type="text" placeholder="Ada Lovelace" name="name" />
              )}
              <Field label="EMAIL" type="email" placeholder="you@company.dev" name="email" />
              <Field
                label="PASSWORD"
                type="password"
                placeholder={isSignup ? "at least 6 characters" : "••••••••"}
                name="password"
              />
              {error && (
                <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-4 py-2.5 text-[#8a2b00]">
                  ⚠ {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-purple w-full justify-center mt-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading
                  ? "One sec…"
                  : isSignup
                    ? "Create account ✦"
                    : "Sign in →"}
              </button>
            </form>

            <p className="text-center text-[14px] text-muted mt-6">
              {isSignup ? "Already have an account? " : "New to GoHackerz? "}
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
  name,
}: {
  label: string;
  type: string;
  placeholder: string;
  name: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] text-subtle font-bold">
        {label}
      </span>
      <input
        type={type}
        required
        name={name}
        placeholder={placeholder}
        className="w-full mt-1 border-2 border-ink rounded-xl px-4 py-3 text-[15px] outline-none shadow-pop-sm focus:shadow-pop transition-shadow bg-card text-ink"
      />
    </label>
  );
}
