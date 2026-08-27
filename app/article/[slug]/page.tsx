import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleActions } from "@/components/ArticleActions";
import { ArticleCard } from "@/components/ArticleCard";
import { CommentSection } from "@/components/CommentSection";
import { ViewPing } from "@/components/ViewPing";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TextSizeControl } from "@/components/TextSizeControl";
import { FollowButton } from "@/components/FollowButton";
import {
  SectionNavbar,
  TableOfContentsCard,
} from "@/components/TableOfContents";
import { extractHeadings } from "@/lib/content";
import {
  getArticle,
  getAuthor,
  getTopic,
  getArticlesByTopic,
  preloadCardData,
} from "@/lib/queries";
import {
  formatDate,
  topicChipClass,
} from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not found — GoHackerz" };
  return {
    title: `${article.seoTitle || article.title} — GoHackerz`,
    description: article.seoDescription || article.dek,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.dek,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const author = (await getAuthor(article.authorUsername))!;
  const topic = (await getTopic(article.topicSlug))!;
  const related = (await getArticlesByTopic(topic.slug))
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);
  const relatedCardData = await preloadCardData(related);

  // Medium-style section navigation for long reads (3+ sections)
  const headings = extractHeadings(article.content);
  const showToc = headings.length >= 3;

  // ── JSON-LD: Article + BreadcrumbList for search engines ──
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${SITE}/article/${article.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.seoTitle || article.title,
      description: article.seoDescription || article.dek,
      url: articleUrl,
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      datePublished: new Date(article.publishedAt).toISOString(),
      ...(article.coverImage ? { image: [article.coverImage] } : {}),
      author: {
        "@type": "Person",
        name: author.name,
        url: `${SITE}/writer/${author.username}`,
      },
      publisher: {
        "@type": "Organization",
        name: "GoHackerz",
        url: SITE,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        {
          "@type": "ListItem",
          position: 2,
          name: topic.name,
          item: `${SITE}/topic/${topic.slug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: articleUrl,
        },
      ],
    },
  ];

  return (
    <article className="wrap max-w-[820px] pt-8 pb-4">
      <ReadingProgress />
      {showToc && <SectionNavbar headings={headings} />}
      <ViewPing slug={article.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* cover */}
      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt=""
          className="w-full h-[280px] sm:h-[360px] object-cover rounded-3xl border-2 border-ink shadow-pop-lg mb-8"
        />
      )}
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
      <Link href={`/topic/${topic.slug}`} className={`chip ${topicChipClass[topic.color]} mb-5`}>
        {topic.emoji} {topic.name}
      </Link>
      <h1 className="text-[clamp(34px,5.5vw,56px)] font-bold leading-[1.02] tracking-tight mt-4 mb-5">
        {article.title}
      </h1>
      <p className="font-serif italic text-[21px] leading-relaxed text-muted mb-8">
        {article.dek}
      </p>

      {/* byline */}
      <div className="flex flex-wrap items-center gap-4 justify-between pb-8 border-b-2 border-ink mb-8">
        <Link
          href={`/writer/${author.username}`}
          className="flex items-center gap-3"
        >
          <Avatar initials={author.initials} color={author.avatarColor} size="lg" src={author.avatarUrl} />
          <div>
            <b className="text-[17px]">{author.name}</b>
            <div className="font-mono text-[12px] text-subtle">
              {formatDate(article.publishedAt)} · {article.readingTime} min read
            </div>
          </div>
        </Link>
        <ArticleActions
          slug={article.slug}
          initialReactions={article.reactions}
          comments={article.comments}
        />
      </div>

      {/* table of contents — reveal probe lets the sticky bar know the intro is done */}
      {showToc && (
        <>
          <span id="toc-reveal" aria-hidden className="block h-0" />
          <TableOfContentsCard headings={headings} />
        </>
      )}

      {/* text-size control */}
      <div className="flex justify-end mb-3 -mt-2">
        <TextSizeControl />
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
      <section className="card p-5 sm:p-7 mt-10 flex flex-col sm:flex-row gap-5 items-start">
        <Avatar initials={author.initials} color={author.avatarColor} size="xl" src={author.avatarUrl} />
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
              <ArticleCard
                key={a.slug}
                article={a}
                author={relatedCardData.authors.get(a.authorUsername)}
                topic={relatedCardData.topics.get(a.topicSlug)}
              />
            ))}
          </section>
        </>
      )}
    </article>
  );
}
