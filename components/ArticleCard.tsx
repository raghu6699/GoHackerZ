import Link from "next/link";
import { Avatar } from "./Avatar";
import { getAuthor, getTopic } from "@/lib/queries";
import {
  type Article,
  type Author,
  type Topic,
  formatCount,
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
      <Link
        href={`/article/${article.slug}`}
        className="group flex items-center gap-4 px-5 py-3.5 border-b-2 border-dashed border-ink/15 last:border-b-0 hover:bg-bg transition-colors"
      >
        <span
          className={`shrink-0 w-[10px] h-[10px] rounded-[3px] border-2 border-ink ${topicChipClass[topic.color].split(" ")[0]}`}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-[16px] font-semibold leading-snug truncate group-hover:text-purple transition-colors">
            {article.title}
          </h4>
          <div className="font-mono text-[11px] text-subtle font-bold mt-0.5 truncate">
            {author.name.toUpperCase()} · {topic.name.toUpperCase()} ·{" "}
            {article.readingTime} MIN · {formatDateShort(article.publishedAt)}
          </div>
        </div>
        <span className="hidden sm:inline-block shrink-0 font-mono text-[11px] font-bold bg-card border-2 border-ink rounded-full px-2 py-[2px] whitespace-nowrap">
          ▲ {formatCount(article.reactions)}
        </span>
      </Link>
    );
  }

  return (
    <article className="card card-hover p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <Link
          href={`/topic/${topic.slug}`}
          className={`chip ${topicChipClass[topic.color]}`}
        >
          {topic.name}
        </Link>
        <span className="font-mono text-[12px] text-subtle font-bold">
          {article.readingTime} min
        </span>
      </div>

      <Link href={`/article/${article.slug}`} className="group">
        <h3 className="text-[22px] font-bold leading-[1.1] mb-2.5 group-hover:text-purple transition-colors">
          {article.title}
        </h3>
      </Link>
      <p className="text-[14px] leading-relaxed text-muted mb-5 flex-1">
        {article.dek}
      </p>

      <div className="flex items-center gap-2.5 pt-4 border-t-2 border-dashed border-ink/20">
        <Link href={`/writer/${author.username}`}>
          <Avatar initials={author.initials} color={author.avatarColor} size="sm" src={author.avatarUrl} />
        </Link>
        <Link
          href={`/writer/${author.username}`}
          className="text-[13px] font-semibold hover:text-purple transition-colors"
        >
          {author.name}
        </Link>
        <span className="ml-auto font-mono text-[12px] font-bold bg-lime text-[#1A1440] border-2 border-ink rounded-full px-2.5 py-[3px]">
          ▲ {formatCount(article.reactions)}
        </span>
      </div>
    </article>
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}