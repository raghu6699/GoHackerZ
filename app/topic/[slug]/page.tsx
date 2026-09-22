import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import {
  getAllTopics,
  getTopic,
  getArticlesByTopic,
  preloadCardData,
} from "@/lib/queries";
import { formatCount } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return { title: "Not found — GoHackerz" };
  const topicUrl = `${SITE_URL}/topic/${topic.slug}`;
  const title = `${topic.name} Essays & Engineering Teardowns — GoHackerz`;
  const description = topic.description;

  return {
    title: { absolute: title },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: topicUrl },
    openGraph: {
      title,
      description,
      url: topicUrl,
      siteName: "GoHackerz",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topics = await getAllTopics();
  const topic = await getTopic(slug);
  if (!topic) notFound();

  const posts = await getArticlesByTopic(topic.slug);
  const totalReactions = posts.reduce((s, a) => s + a.reactions, 0);
  const cardData = await preloadCardData(posts);

  const topicUrl = `${SITE_URL}/topic/${topic.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${topic.name} Essays`,
      description: topic.description,
      url: topicUrl,
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
        { "@type": "ListItem", position: 2, name: "Topics", item: `${SITE_URL}/topics` },
        { "@type": "ListItem", position: 3, name: topic.name, item: topicUrl },
      ],
    },
  ];

  return (
    <div className="wrap pt-8 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* topic header */}
      <header className="relative overflow-hidden bg-card border-2 border-ink rounded-3xl shadow-pop-lg p-5 sm:p-10 mb-10 dotgrid">
        <div className="relative flex items-start gap-5">
          <span className="text-[64px] leading-none">{topic.emoji}</span>
          <div>
            <div className="font-mono text-[13px] text-purple font-bold mb-1">
              #{topic.slug}
            </div>
            <h1 className="text-[clamp(36px,6vw,64px)] font-bold tracking-tight leading-none mb-3">
              {topic.name}
            </h1>
            <p className="text-[18px] leading-relaxed text-muted max-w-[560px] mb-5">
              {topic.description}
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <span className="chip bg-lime text-[#1A1440]">{posts.length} essays</span>
              <span className="chip bg-sky text-[#1A1440]">
                ▲ {formatCount(totalReactions)} reactions
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* other topics */}
      <div className="flex gap-2.5 flex-wrap mb-10">
        {topics.map((t) => (
          <Link
            key={t.slug}
            href={`/topic/${t.slug}`}
            className={`chip ${
              t.slug === topic.slug ? "bg-purple text-white" : "bg-card text-ink"
            }`}
          >
            {t.emoji} {t.name}
          </Link>
        ))}
      </div>

      {/* posts */}
      {posts.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((a) => (
            <ArticleCard
              key={a.slug}
              article={a}
              author={cardData.authors.get(a.authorUsername)}
              topic={cardData.topics.get(a.topicSlug)}
            />
          ))}
        </section>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-[20px] font-semibold">
            No essays here yet. Be the first ✦
          </p>
          <Link href="/write" className="btn btn-purple mt-5">
            Write about {topic.name}
          </Link>
        </div>
      )}
    </div>
  );
}
