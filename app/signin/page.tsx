import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in — GoHackerz" };

export default async function SignInPage() {
  const user = await getCurrentDbUser();
  if (user) {
    redirect("/profile");
  }

  return <AuthForm mode="signin" />;
}
