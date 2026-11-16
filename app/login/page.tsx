import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; redirect?: string }>;
}) {
  const sp = (await searchParams) || {};
  const next = safeNext(sp.next ?? sp.redirect, "/");
  redirect(next !== "/" ? `/signin?next=${encodeURIComponent(next)}` : "/signin");
}
