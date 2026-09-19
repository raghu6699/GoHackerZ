import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { HeroBanner } from "@/components/HeroBanner";
import { getLatest, preloadCardData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Read",
  description: "Browse the latest practical essays from GoHackerz.",
};

export default async function ReadPage() {
  const posts = await getLatest(30);
  const cardData = await preloadCardData(posts);

  return (
    <div className="wrap py-6">
      <HeroBanner />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {posts.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            author={cardData.authors.get(article.authorUsername)}
            topic={cardData.topics.get(article.topicSlug)}
          />
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-purple">Back to home</Link>
      </div>
    </div>
  );
}
