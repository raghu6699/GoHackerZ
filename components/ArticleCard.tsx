import Link from "next/link";
import { Avatar } from "./Avatar";
import { QuickSaveButton } from "./QuickSaveButton";
import { QuickReactButton } from "./QuickReactButton";
import { getAuthor, getTopic } from "@/lib/queries";
import {
  type Article,
  type Author,
  type Topic,
  formatCount,
  formatDateRelative,
  topicChipClass,
} from "@/lib/data";

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

  if (variant === "compact") {
    return (
      <div className="group flex items-center gap-3.5 px-4 sm:px-5 py-3.5 border-b border-ink/10 last:border-b-0 hover:bg-card/60 transition-colors">
        <span className="shrink-0 w-2 h-2 rounded-full bg-purple" />
        <Link href={`/article/${article.slug}`} className="min-w-0 flex-1">
          <h4 className="text-[15px] sm:text-[16px] font-semibold leading-snug truncate group-hover:text-purple transition-colors">
            {article.title}
          </h4>
          <div className="font-mono text-[11px] text-subtle font-medium mt-1 truncate">
            {author.name} · <span className="text-ink font-semibold">{topic.name}</span> ·{" "}
            {article.readingTime} min · {formatDateRelative(article.publishedAt)}
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <QuickReactButton slug={article.slug} initialCount={article.reactions} />
          <QuickSaveButton slug={article.slug} />
        </div>
      </div>
    );
  }

  return (
    <article className="card card-hover p-5 sm:p-6 flex flex-col h-full bg-card relative">
      <div className="flex justify-between items-center mb-3.5">
        <Link
          href={`/topic/${topic.slug}`}
          className="chip hover:border-purple text-subtle hover:text-purple transition-colors"
        >
          {topic.emoji} {topic.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-subtle font-medium">
            {article.readingTime} min read
          </span>
          <QuickSaveButton slug={article.slug} />
        </div>
      </div>

      <Link href={`/article/${article.slug}`} className="group">
        <h3 className="text-[19px] sm:text-[21px] font-bold leading-[1.15] mb-2.5 group-hover:text-purple transition-colors">
          {article.title}
        </h3>
      </Link>
      <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-muted mb-5 flex-1 line-clamp-2">
        {article.dek}
      </p>

      <div className="flex items-center gap-2.5 pt-3.5 border-t border-ink/10">
        <Link href={`/writer/${author.username}`}>
          <Avatar initials={author.initials} color={author.avatarColor} size="sm" src={author.avatarUrl} />
        </Link>
        <Link
          href={`/writer/${author.username}`}
          className="text-[13px] font-semibold hover:text-purple transition-colors truncate"
        >
          {author.name}
        </Link>
        <div className="ml-auto">
          <QuickReactButton slug={article.slug} initialCount={article.reactions} />
        </div>
      </div>
    </article>
  );
}
