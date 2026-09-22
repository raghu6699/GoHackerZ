import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { WriterProfileHeader } from "@/components/WriterProfileHeader";
import {
  getAllAuthors,
  getAuthor,
  getArticlesByAuthor,
  preloadCardData,
} from "@/lib/queries";
import { formatCount } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthor(username);
  if (!author) return { title: "Not found — GoHackerz" };

  const writerUrl = `${SITE_URL}/writer/${author.username}`;
  const title = `${author.name} (${author.role} @ ${author.company}) — GoHackerz`;
  const description = author.bio;

  return {
    title: { absolute: title },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: writerUrl },
    openGraph: {
      title,
      description,
      url: writerUrl,
      siteName: "GoHackerz",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WriterPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const authors = await getAllAuthors();
  const author = await getAuthor(username);
  if (!author) notFound();

  const posts = await getArticlesByAuthor(author.username);
  const totalReactions = posts.reduce((s, a) => s + a.reactions, 0);
  const cardData = await preloadCardData(posts);

  const writerUrl = `${SITE_URL}/writer/${author.username}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: author.name,
      url: writerUrl,
      mainEntity: {
        "@type": "Person",
        name: author.name,
        alternateName: author.username,
        jobTitle: author.role,
        worksFor: {
          "@type": "Organization",
          name: author.company,
        },
        description: author.bio,
        url: writerUrl,
      },
    },
  ];

  return (
    <div className="wrap pt-8 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* profile header with interactive follow toast */}
      <WriterProfileHeader author={author} totalReactions={totalReactions} />

      {/* other writers */}
      <div className="flex gap-2.5 flex-wrap mb-10">
        {authors.map((a) => (
          <Link
            key={a.username}
            href={`/writer/${a.username}`}
            className={`chip ${
              a.username === author.username ? "bg-purple text-white" : "bg-card text-ink"
            }`}
          >
            {a.name}
          </Link>
        ))}
      </div>

      <h2 className="text-[28px] font-bold mb-6">
        Essays by {author.name.split(" ")[0]}
      </h2>
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
        <div className="card p-10 text-center text-[18px] font-semibold">
          No published essays yet.
        </div>
      )}
    </div>
  );
}
