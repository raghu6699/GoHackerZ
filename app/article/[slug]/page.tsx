import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleActions } from "@/components/ArticleActions";
import { ArticleCard } from "@/components/ArticleCard";
import { CommentSection } from "@/components/CommentSection";
import { FollowButton } from "@/components/FollowButton";
import {
  articles,
  getArticle,
  getAuthor,
  getTopic,
  getArticlesByTopic,
  formatDate,
} from "@/lib/data";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = getArticle(params.slug);
  if (!article) return { title: "Not found — GoHackerz" };
  return { title: `${article.title} — GoHackerz`, description: article.dek };
}

export default function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const author = getAuthor(article.authorUsername)!;
  const topic = getTopic(article.topicSlug)!;
  const related = getArticlesByTopic(topic.slug)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <article className="wrap max-w-[820px] pt-8 pb-4">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[12px] text-subtle mb-6">
        <Link href="/" className="hover:text-purple">
          Home
        </Link>
        <span>/</span>
        <Link href={`/topic/${topic.slug}`} className="hover:text-purple">
          {topic.name}
        </Link>
      </div>

      {/* header */}
      <Link href={`/topic/${topic.slug}`} className="chip bg-sky text-[#1A1440] mb-5">
        {topic.emoji} {topic.name}
      </Link>
      <h1 className="text-[clamp(34px,5.5vw,56px)] font-bold leading-[1.02] tracking-tight mt-4 mb-5">
        {article.title}
      </h1>
      <p className="text-[20px] leading-relaxed text-muted mb-8">
        {article.dek}
      </p>

      {/* byline */}
      <div className="flex flex-wrap items-center gap-4 justify-between pb-8 border-b-2 border-ink mb-8">
        <Link
          href={`/writer/${author.username}`}
          className="flex items-center gap-3"
        >
          <Avatar initials={author.initials} color={author.avatarColor} size="lg" />
          <div>
            <b className="text-[17px]">{author.name}</b>
            <div className="font-mono text-[12px] text-subtle">
              {formatDate(article.publishedAt)} · {article.readingTime} min read
            </div>
          </div>
        </Link>
        <ArticleActions
          initialReactions={article.reactions}
          comments={article.comments}
        />
      </div>

      {/* body */}
      <ArticleBody content={article.content} />

      {/* tags */}
      <div className="flex gap-2 flex-wrap mt-10">
        {article.tags.map((t) => (
          <span key={t} className="chip bg-peach text-[#1A1440]">
            #{t}
          </span>
        ))}
      </div>

      {/* author card */}
      <section className="card p-7 mt-10 flex flex-col sm:flex-row gap-5 items-start">
        <Avatar initials={author.initials} color={author.avatarColor} size="xl" />
        <div>
          <div className="font-mono text-[11px] text-subtle mb-1">
            WRITTEN BY
          </div>
          <Link
            href={`/writer/${author.username}`}
            className="text-[24px] font-bold hover:text-purple transition-colors"
          >
            {author.name}
          </Link>
          <div className="font-mono text-[12px] text-purple mb-3">
            {author.role} @ {author.company}
          </div>
          <p className="text-[15px] leading-relaxed text-muted mb-4 max-w-[520px]">
            {author.bio}
          </p>
          <div className="flex gap-2.5 items-center">
            <FollowButton
              authorName={author.name}
              authorUsername={author.username}
              variant="purple"
            />
            <Link
              href={`/writer/${author.username}`}
              className="btn btn-sm"
            >
              Profile →
            </Link>
          </div>
        </div>
      </section>

      {/* comments section */}
      <CommentSection articleSlug={article.slug} articleTitle={article.title} />

      {/* related */}
      {related.length > 0 && (
        <>
          <h2 className="text-[28px] font-bold mt-14 mb-6">
            More in {topic.name} {topic.emoji}
          </h2>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </section>
        </>
      )}
    </article>
  );
}
