import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Auth error — GoHackerz" };

export default function AuthErrorPage() {
  return (
    <div className="wrap max-w-[480px] py-24 text-center">
      <div className="text-[56px] mb-4">😵</div>
      <h1 className="text-[28px] font-bold mb-2">That link didn&apos;t work</h1>
      <p className="text-muted text-[15px] mb-8">
        The link may have expired or already been used. Try signing in again,
        or request a fresh email.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/signin" className="btn btn-purple">
          Sign in
        </Link>
        <Link href="/signup" className="btn">
          Create account
        </Link>
      </div>
    </div>
  );
}