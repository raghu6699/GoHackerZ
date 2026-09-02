import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Access your GoHackerz account or create one for free.",
};

export default function SignInAliasPage() {
  redirect("/signin");
}
