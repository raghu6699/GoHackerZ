import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { getEditableArticle } from "@/lib/queries";
import { WriteEditor } from "@/components/WriteEditor";

export const metadata: Metadata = { title: "Write — GoHackerz" };

export default async function WritePage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin");

  let initial = undefined;
  if (searchParams.edit) {
    const existing = await getEditableArticle(searchParams.edit, user.id);
    if (existing && existing.status !== "PUBLISHED") {
      initial = {
        slug: existing.slug,
        title: existing.title,
        dek: existing.dek,
        topicSlug: existing.topicSlug,
        content: existing.content,
        coverImage: null,
        seoTitle: null,
        seoDescription: null,
        scheduledAt: null,
      };
    }
  }

  return <WriteEditor initial={initial} />;
}
