import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in — Lore" };

export default function SignInPage() {
  return <AuthForm mode="signin" />;
}
