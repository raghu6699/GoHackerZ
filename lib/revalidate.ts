import { revalidatePath } from "next/cache";

/**
 * Revalidates all cached page routes that display articles.
 */
export function revalidateArticlePaths(
  slug?: string | null,
  topicSlug?: string | null,
  authorUsername?: string | null
) {
  try {
    revalidatePath("/");
    revalidatePath("/read");
    revalidatePath("/deep-dives");
    revalidatePath("/drafts");
    revalidatePath("/review");
    revalidatePath("/topics");
    if (slug) revalidatePath(`/article/${slug}`);
    if (topicSlug) revalidatePath(`/topic/${topicSlug}`);
    if (authorUsername) revalidatePath(`/writer/${authorUsername}`);
  } catch (err) {
    console.error("revalidateArticlePaths error:", err);
  }
}
