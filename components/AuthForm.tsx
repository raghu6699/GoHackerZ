"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "./Logo";
import { safeNext } from "@/lib/safe-redirect";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const searchParams = useSearchParams();
  // Where to go after auth. The register page and the route guard send ?next=;
  // older links used ?redirect=. Both are accepted, and only same-site paths are allowed.
  const redirectTarget = safeNext(searchParams?.get("next") ?? searchParams?.get("redirect"), "/");
  const nextQuery = redirectTarget !== "/" ? `?next=${encodeURIComponent(redirectTarget)}` : "";
  const callbackUrl = (origin: string) => `${origin}/auth/callback${nextQuery}`;
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

    try {
      const res = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: typedEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setResending(false);
        setResendMsg(`Confirmation email dispatched to ${typedEmail}! Please check your inbox and Junk/Spam folder.`);
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
        emailRedirectTo: callbackUrl(window.location.origin),
      },
    });

    setResending(false);

    if (resendErr) {
      setError(resendErr.message);
    } else {
      setResendMsg(`Confirmation email re-sent to ${typedEmail}! Please check your inbox and Junk/Spam folder.`);
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
        options: { data: { name }, emailRedirectTo: callbackUrl(window.location.origin) },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      // The account stays unconfirmed until the owner of the address clicks the
      // one-time link we email them (sent via Resend).
      try {
        await fetch("/api/auth/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, next: redirectTarget }),
        });
      } catch {
        // non-fatal: the "resend confirmation" button covers this
      }

      setDone(true);
      setLoading(false);
      return;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
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
      await syncProfile(data.session);
      router.push(redirectTarget);
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
        redirectTo: callbackUrl(window.location.origin),
      },
    });

    if (error) setError(error.message);
  }

  return (
    <div className="wrap max-w-[480px] py-16">
      <div className="relative card shadow-pop-lg p-5 sm:p-9">
        <span className="absolute -top-4 -right-3 chip bg-lime text-[#1A1440] border-[#1A1440]/20 rotate-6 shadow-pop-sm">
          {isSignup ? "free forever ✦" : "welcome back 👋"}
        </span>

        <Logo className="mb-6" />

        {done ? (
          <div className="text-center py-6">
            <div className="text-[56px] mb-3">⚡</div>
            <h1 className="text-[26px] font-bold mb-2">You&apos;re into RepoRally! 🎉</h1>
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
              href={`/signin${nextQuery}`}
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
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px]"
                >
                  <path
                    fill="currentColor"
                    d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12.01 12.01 0 0 0 12 .5z"
                  />
                </svg>
                Continue with GitHub
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
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  className="h-[18px] w-[18px]"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.27 5.64c4.25-3.92 7.52-9.71 7.52-17.29Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.27-5.64c-2.02 1.36-4.6 2.17-8.63 2.17-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                  />
                </svg>
                Continue with Google
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
              {isSignup ? "Already have an account? " : "New to RepoRally? "}
              <Link
                href={`${isSignup ? "/signin" : "/signup"}${nextQuery}`}
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
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = name === "password" || type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

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
      <div className="relative">
        <input
          type={inputType}
          name={name}
          required
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full px-3.5 py-2.5 rounded-xl border-2 border-ink bg-bg text-ink placeholder:text-muted/60 text-[15px] font-medium outline-none focus:border-purple focus:shadow-pop-sm transition-all ${
            isPasswordField ? "pr-10" : ""
          }`}
        />
        {isPasswordField && (
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
        )}
      </div>
    </label>
  );
}
