import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentDbUser } from "@/lib/profile";
import { getEditableArticle, getAllTopics } from "@/lib/queries";
import { WriteEditor } from "@/components/WriteEditor";

export const metadata: Metadata = { title: "Write — GoHackerz" };

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const [user, allTopics] = await Promise.all([
    getCurrentDbUser(),
    getAllTopics(),
  ]);

  if (!user) {
    return (
      <div className="wrap max-w-5xl py-12">
        <div className="rounded-3xl border-2 border-ink bg-card p-6 sm:p-10 shadow-pop-lg">
          <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-purple">Write for GoHackerz</div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Write the kind of engineering essay people actually save.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            We publish practical, field-tested writing: architecture decisions, incident reviews, database trade-offs, AI systems, Rust, and the messy realities of shipping complicated software.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-purple">Create an account</Link>
            <Link href="/signin" className="btn btn-lime">Sign in</Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border-2 border-ink bg-card p-6">
            <h2 className="text-2xl font-bold">What we publish</h2>
            <ul className="mt-4 space-y-3 text-muted">
              <li>• Postmortems and incident write-ups with real trade-offs.</li>
              <li>• Architecture essays about monoliths, distributed systems, and refactors.</li>
              <li>• Databases, performance tuning, and observability stories worth sharing.</li>
              <li>• AI engineering and tool-making from people shipping in the real world.</li>
            </ul>
          </section>

          <section className="rounded-3xl border-2 border-ink bg-card p-6">
            <h2 className="text-2xl font-bold">Tone and style</h2>
            <ul className="mt-4 space-y-3 text-muted">
              <li>• Clear and specific; no vague startup fluff.</li>
              <li>• Prefer lessons over hype and measurements over vibes.</li>
              <li>• Use code examples where they clarify the point.</li>
              <li>• Write like a practitioner who has been in the trenches.</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 rounded-3xl border-2 border-ink bg-[#17132a] p-6 text-white">
          <h2 className="text-2xl font-bold">Submission process</h2>
          <ol className="mt-4 space-y-3 text-[#ded8ff]">
            <li>1. Draft a title, deck, and 2–3 key takeaways.</li>
            <li>2. Publish in a topic that matches the story.</li>
            <li>3. Share concrete examples, benchmarks, and code when relevant.</li>
            <li>4. We review for depth, clarity, and signal over noise.</li>
          </ol>
        </div>
      </div>
    );
  }

  let initial = undefined;
  if (sp.edit) {
    const existing = await getEditableArticle(sp.edit, user.id);
    if (existing) {
      initial = {
        slug: existing.slug,
        title: existing.title,
        dek: existing.dek,
        topicSlug: existing.topicSlug,
        content: existing.content,
        coverImage: existing.coverImage ?? null,
        seoTitle: existing.seoTitle ?? null,
        seoDescription: existing.seoDescription ?? null,
        scheduledAt: existing.scheduledAt ?? null,
        status: existing.status,
      };
    }
  }

  return <WriteEditor initial={initial} availableTopics={allTopics} />;
}
