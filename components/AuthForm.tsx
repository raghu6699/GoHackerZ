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
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [typedEmail, setTypedEmail] = useState("");

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

  async function syncProfile(session?: { access_token?: string; refresh_token?: string } | null) {
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session?.access_token,
          refresh_token: session?.refresh_token,
        }),
      });
    } catch {
      // non-fatal
    }
  }

  async function handleResendConfirmation() {
    if (!typedEmail) {
      setError("Please enter your email address to resend confirmation.");
      return;
    }

    setResending(true);
    setResendMsg(null);
    setError(null);

    // Try auto-confirming via backend + sending welcome email via Resend
    try {
      const autoRes = await fetch("/api/auth/auto-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: typedEmail }),
      });
      const autoData = await autoRes.json().catch(() => ({}));

      if (autoData.confirmed) {
        setResending(false);
        setResendMsg(`Account activated! A welcome email was sent to ${typedEmail}. You can now sign in.`);
        return;
      }
    } catch {
      // fallback to Supabase standard resend
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Auth is not configured in this environment.");
      setResending(false);
      return;
    }

    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: typedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setResending(false);

    if (resendErr) {
      setError(resendErr.message);
    } else {
      setResendMsg(`Confirmation email re-sent to ${typedEmail}! Please check your inbox and spam folder.`);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendMsg(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    setTypedEmail(email);

    const supabase = createClient();
    if (!supabase) {
      setError("Auth isn't configured in this environment.");
      setLoading(false);
      return;
    }

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
      
      // Directly activate their mail account server-side & send welcome email
      try {
        await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, userId: data.user?.id }),
        });
      } catch {
        // non-fatal
      }

      setDone(true);
      setLoading(false);
      return;
    } else {
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && error.message.toLowerCase().includes("not confirmed")) {
        // Auto-confirm unconfirmed account on sign in attempt
        try {
          const autoRes = await fetch("/api/auth/auto-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const autoData = await autoRes.json().catch(() => ({}));
          if (autoData.confirmed) {
            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            data = retry.data;
            error = retry.error;
          }
        } catch {
          // preserve original error if fallback fails
        }
      }

      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Wrong email or password."
            : error.message
        );
        setLoading(false);
        return;
      }
      await syncProfile(data.session);
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
    if (!supabase) {
      setError("Auth isn't configured in this environment.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
  }

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="relative card shadow-pop-lg p-5 sm:p-9">
        <span className="absolute -top-4 -right-3 chip bg-lime rotate-6 shadow-pop-sm">
          {isSignup ? "free forever ✦" : "welcome back 👋"}
        </span>

        <Logo className="mb-6" />

        {done ? (
          <div className="text-center py-6">
            <div className="text-[56px] mb-3">⚡</div>
            <h1 className="text-[26px] font-bold mb-2">You&apos;re into GoHackerz! 🎉</h1>
            <p className="text-muted text-[15px] mb-6">
              Your account details have been saved and activated. A welcome email is on its way to{" "}
              <strong className="text-ink">{typedEmail}</strong>.
            </p>
            <div className="p-4 bg-purple/10 border-2 border-purple rounded-xl mb-6 text-left">
              <p className="font-mono text-xs font-bold text-purple mb-1">NEXT STEP:</p>
              <p className="text-[14px] text-ink font-medium">
                Please sign in with the email and password you just provided to log into your workspace.
              </p>
            </div>
            <Link
              href="/signin"
              onClick={() => setDone(false)}
              className="btn btn-purple w-full justify-center text-[15px]"
            >
              Sign in with your details →
            </Link>
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
                <span className="font-bold text-purple">G</span> Continue with Google
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
              <Field
                label="EMAIL"
                type="email"
                placeholder="you@company.dev"
                name="email"
                onChange={(e) => setTypedEmail(e.target.value)}
              />
              <Field
                label="PASSWORD"
                type="password"
                placeholder={isSignup ? "at least 6 characters" : "••••••••"}
                name="password"
                isSignup={isSignup}
              />

              {error && (
                <div className="space-y-2">
                  <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-4 py-2.5 text-[#8a2b00]">
                    ⚠ {error}
                  </p>
                  {error.toLowerCase().includes("not confirmed") && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="btn btn-lime text-[#1A1440] font-bold text-xs w-full justify-center"
                    >
                      {resending ? "Sending link…" : "📩 Resend Confirmation Email"}
                    </button>
                  )}
                </div>
              )}

              {resendMsg && (
                <p className="font-mono text-[12px] font-bold bg-lime border-2 border-ink rounded-xl px-4 py-2.5 text-[#1A1440]">
                  ✓ {resendMsg}
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
  onChange,
  isSignup,
}: {
  label: string;
  type: string;
  placeholder: string;
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSignup?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex justify-between items-center mb-1">
        <span className="block font-mono text-[11px] font-bold text-subtle">
          {label}
        </span>
        {name === "password" && !isSignup && (
          <Link
            href="/forgot-password"
            className="font-mono text-[11px] font-bold text-purple hover:underline"
          >
            Forgot password?
          </Link>
        )}
      </div>
      <input
        type={type}
        name={name}
        required
        placeholder={placeholder}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink bg-bg text-ink placeholder:text-muted/60 text-[15px] font-medium outline-none focus:border-purple focus:shadow-pop-sm transition-all"
      />
    </label>
  );
}
