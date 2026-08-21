import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { WriterProfileHeader } from "@/components/WriterProfileHeader";
import {
  authors,
  getAuthor,
  getArticlesByAuthor,
  formatCount,
} from "@/lib/data";

export function generateStaticParams() {
  return authors.map((a) => ({ username: a.username }));
}

export function generateMetadata({
  params,
}: {
  params: { username: string };
}): Metadata {
  const author = getAuthor(params.username);
  if (!author) return { title: "Not found — Lore" };
  return { title: `${author.name} — Lore`, description: author.bio };
}

export default function WriterPage({
  params,
}: {
  params: { username: string };
}) {
  const author = getAuthor(params.username);
  if (!author) notFound();

  const posts = getArticlesByAuthor(author.username);
  const totalReactions = posts.reduce((s, a) => s + a.reactions, 0);

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
            <ArticleCard key={a.slug} article={a} />
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
