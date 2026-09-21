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
  FloatingToc,
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
import { SITE_URL } from "@/lib/site";

function formatMetaTitle(rawTitle: string): string {
  const brand = " — GoHackerz";
  const clean = (rawTitle || "").trim();
  if (clean.length + brand.length <= 60) {
    return `${clean}${brand}`;
  }
  if (clean.length <= 60) {
    return clean;
  }
  return `${clean.slice(0, 56).replace(/\s+\S*$/, "")}…`;
}

function formatMetaDescription(rawDek: string): string {
  const clean = (rawDek || "").trim().replace(/\s+/g, " ");
  if (!clean) return "Honest engineering essays and post-mortems on GoHackerz.";
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not found — GoHackerz" };

  const ogApiUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.authorUsername)}&topic=${encodeURIComponent(article.topicSlug)}&time=${article.readingTime}`;

  const title = formatMetaTitle(article.seoTitle || article.title);
  const description = formatMetaDescription(article.seoDescription || article.dek);
  const articleUrl = `${SITE_URL}/article/${article.slug}`;

  return {
    title: {
      absolute: title,
    },
    description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description,
      url: articleUrl,
      siteName: "GoHackerz",
      type: "article",
      publishedTime: new Date(article.publishedAt).toISOString(),
      images: [
        {
          url: ogApiUrl,
          secureUrl: ogApiUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogApiUrl],
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
  const articleUrl = `${SITE_URL}/article/${article.slug}`;
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
        url: `${SITE_URL}/writer/${author.username}`,
      },
      publisher: {
        "@type": "Organization",
        name: "GoHackerz",
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: topic.name,
          item: `${SITE_URL}/topic/${topic.slug}`,
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
    <article className="wrap max-w-[1240px] pt-8 pb-12">
      <ReadingProgress />
      {showToc && <FloatingToc headings={headings} />}
      <ViewPing slug={article.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] gap-8 xl:gap-12 items-start">
        {/* Main Article Content */}
        <div className="min-w-0 max-w-[820px] mx-auto lg:mx-0 w-full">
          {/* cover */}
          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt=""
              className="w-full h-[280px] sm:h-[380px] object-cover rounded-3xl border-2 border-ink shadow-pop-lg mb-8"
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
          <h1 className="text-[clamp(34px,5vw,54px)] font-bold leading-[1.04] tracking-tight mt-4 mb-5">
            {article.title}
          </h1>
          <p className="font-serif italic text-[20px] sm:text-[22px] leading-relaxed text-muted mb-8">
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
              title={article.title}
              dek={article.dek}
            />
          </div>

          {/* mobile table of contents */}
          {showToc && (
            <div className="lg:hidden mb-6">
              <span id="toc-reveal" aria-hidden className="block h-0" />
              <TableOfContentsCard headings={headings} />
            </div>
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
        </div>

        {/* Desktop Sticky Sidebar */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          {showToc && (
            <div>
              <span id="toc-reveal" aria-hidden className="block h-0" />
              <TableOfContentsCard headings={headings} />
            </div>
          )}

          <div className="card p-5 shadow-pop">
            <div className="flex items-center gap-3 mb-3">
              <Avatar initials={author.initials} color={author.avatarColor} size="md" src={author.avatarUrl} />
              <div className="min-w-0">
                <Link
                  href={`/writer/${author.username}`}
                  className="font-bold text-[15px] hover:text-purple transition-colors block truncate"
                >
                  {author.name}
                </Link>
                <div className="font-mono text-[11px] text-purple truncate">
                  {author.role} @ {author.company}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-muted leading-relaxed line-clamp-3 mb-4">
              {author.bio}
            </p>
            <FollowButton
              authorName={author.name}
              authorUsername={author.username}
              variant="purple"
            />
          </div>
        </aside>
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-16 pt-10 border-t-2 border-ink/15">
          <h2 className="text-[28px] font-bold mb-6">
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
        </div>
      )}
    </article>
  );
}
