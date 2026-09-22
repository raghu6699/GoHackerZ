import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up — GoHackerz" };

export default async function SignUpPage() {
  const user = await getCurrentDbUser();
  if (user) {
    redirect("/profile");
  }

  return <AuthForm mode="signup" />;
}
