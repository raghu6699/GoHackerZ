import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in — RepoRally" };

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ next?: string; redirect?: string }> }) {
  const sp = (await searchParams) || {};
  const user = await getCurrentDbUser();
  if (user) {
    redirect(safeNext(sp.next ?? sp.redirect, "/profile"));
  }

  return (
    <Suspense fallback={<div className="wrap max-w-[480px] py-16 text-center text-subtle">Loading...</div>}>
      <AuthForm mode="signin" />
    </Suspense>
  );
}
