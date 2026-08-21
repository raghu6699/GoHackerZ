import Link from "next/link";
import { Avatar } from "./Avatar";
import {
  type Article,
  type AvatarColor,
  getAuthor,
  getTopic,
  formatCount,
} from "@/lib/data";

const tagColors: Record<AvatarColor, string> = {
  sky: "bg-sky text-[#1A1440]",
  pink: "bg-pink text-[#1A1440]",
  peach: "bg-peach text-[#1A1440]",
  lime: "bg-lime text-[#1A1440]",
  purple: "bg-purple text-white",
  ink: "bg-card text-ink",
};

export function ArticleCard({ article }: { article: Article }) {
  const author = getAuthor(article.authorUsername)!;
  const topic = getTopic(article.topicSlug)!;

  return (
    <article className="card card-hover p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <Link
          href={`/topic/${topic.slug}`}
          className={`chip ${tagColors[topic.color]}`}
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
          <Avatar initials={author.initials} color={author.avatarColor} size="sm" />
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
