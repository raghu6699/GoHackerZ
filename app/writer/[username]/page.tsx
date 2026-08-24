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

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const author = await getAuthor(params.username);
  if (!author) return { title: "Not found — GoHackerz" };
  return { title: `${author.name} — GoHackerz`, description: author.bio };
}

export default async function WriterPage({
  params,
}: {
  params: { username: string };
}) {
  const authors = await getAllAuthors();
  const author = await getAuthor(params.username);
  if (!author) notFound();

  const posts = await getArticlesByAuthor(author.username);
  const totalReactions = posts.reduce((s, a) => s + a.reactions, 0);
  const cardData = await preloadCardData(posts);

  return (
    <div className="wrap pt-8 pb-4">
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
