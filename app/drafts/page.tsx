import { redirect } from "next/navigation";

export default function DraftsPage() {
  redirect("/profile?tab=posts");
}