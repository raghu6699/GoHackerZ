import { ArticleCardView } from "./ArticleCardView";
import { getAuthor, getTopic } from "@/lib/queries";
import type { Article, Author, Topic } from "@/lib/data";

/**
 * ArticleCard — two variants:
 *  - "grid" (default): the playful sticker card used in card grids.
 *  - "compact": dense list row that doubles feed density (HackerNoon-style
 *    scannability) while keeping the sticker identity.
 *
 * Pass `author`/`topic` from preloadCardData() on list pages to avoid two
 * DB queries per card; without them it falls back to individual lookups.
 */
export async function ArticleCard({
  article,
  variant = "grid",
  author: prefetchedAuthor,
  topic: prefetchedTopic,
}: {
  article: Article;
  variant?: "grid" | "compact";
  author?: Author;
  topic?: Topic;
}) {
  const author = prefetchedAuthor ?? (await getAuthor(article.authorUsername));
  const topic = prefetchedTopic ?? (await getTopic(article.topicSlug));
  if (!author || !topic) return null;

  return (
    <ArticleCardView
      article={article}
      author={author}
      topic={topic}
      variant={variant}
    />
  );
}

