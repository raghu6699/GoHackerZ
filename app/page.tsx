import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ArticleCard } from "@/components/ArticleCard";
import { SponsoredCard } from "@/components/SponsoredCard";
import { SectionHead } from "@/components/SectionHead";
import { NewsletterForm } from "@/components/NewsletterForm";
import {
  getFeatured,
  getLatest,
  getTrending,
  getAuthor,
  getTopic,
  getAllTopics,
  preloadCardData,
} from "@/lib/queries";
import { formatCount, formatDate } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const featured = await getFeatured();
  if (!featured) notFound();

  const featuredAuthor = (await getAuthor(featured.authorUsername))!;
  const featuredTopic = (await getTopic(featured.topicSlug))!;
  const allTopics = await getAllTopics();
  const latest = (await getLatest(3)).filter((a) => !a.featured);
  const trending = await getTrending(4);

  // Dense "more stories" feed with pagination
  const all = await getLatest();
  const shownSlugs = new Set([featured.slug, ...all.slice(0, 3).map((a) => a.slug), ...trending.map((a) => a.slug)]);
  const pool = all.filter((a) => !shownSlugs.has(a.slug));
  const PAGE_SIZE = 6;
  const pageNum = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(pool.length / PAGE_SIZE));
  const page = Math.min(pageNum, totalPages);
  const moreStories = pool.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // One batched round-trip per table for every card on the page.
  const cardData = await preloadCardData([...latest, ...trending, ...moreStories]);

  return (
    <>
      {/* ── Hero ── */}
      <header className="wrap relative pt-8 sm:pt-14 pb-10">
        <span className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-full px-[15px] py-[7px] text-[13px] font-semibold shadow-pop mb-6">
          <span className="text-[15px]">👋</span> New here?{" "}
          <b className="text-purple">Every essay is free, forever →</b>
        </span>
        <h1 className="text-[clamp(42px,7.5vw,86px)] leading-[0.98] tracking-tight font-bold max-w-[12ch] mb-6">
          Where builders <span className="text-purple">actually</span> write.
        </h1>
        <p className="text-[20px] leading-relaxed max-w-[520px] font-medium text-muted mb-8">
          Honest engineering essays, teardowns and post-mortems.{" "}
          <span className="hl">No sludge, no listicles</span> — just the real
          stuff you'll want to save.
        </p>
        <div className="flex gap-3.5 items-center flex-wrap">
          <Link href="/signup" className="btn btn-purple">
            Start reading — free
          </Link>
          <Link href="/write" className="btn btn-lime">
            Write a post ✦
          </Link>
        </div>
        <div className="flex gap-5 sm:gap-7 mt-8 sm:mt-10 font-medium flex-wrap">
          {[
            ["640+", "essays"],
            ["12k", "writers"],
            ["190k", "subscribers"],
          ].map(([n, l]) => (
            <div key={l}>
              <b className="text-[22px] sm:text-[26px] block text-purple">{n}</b>
              <span className="text-[13px] text-subtle">{l}</span>
            </div>
          ))}
        </div>

        {/* floating stickers */}
        <div className="hidden lg:block">
          <Sticker className="top-[70px] right-[40px] bg-pink text-[#1A1440] rotate-[6deg]">
            p99 ↓ 40× 🚀
          </Sticker>
          <Sticker className="top-[145px] right-[210px] bg-peach text-[#1A1440] -rotate-[5deg]">
            no clickbait 🚫
          </Sticker>
          <Sticker className="top-[210px] right-[20px] bg-sky text-[#1A1440] rotate-[4deg]">
            real engineers
          </Sticker>
          <Sticker className="top-[290px] right-[200px] bg-lime text-[#1A1440] -rotate-[6deg]">
            evals &gt; vibes 📊
          </Sticker>
          <Sticker className="top-[365px] right-[40px] bg-sky text-[#1A1440] rotate-[5deg]">
            ✦ Rust
          </Sticker>
          <Sticker className="top-[435px] right-[180px] bg-peach text-[#1A1440] -rotate-[4deg]">
            no paywall 🎉
          </Sticker>
        </div>
      </header>

      {/* ── Featured ── */}
      <div className="wrap">
        <SectionHead title="Today's headliner" note="// editor's pick" />
        <section className="relative overflow-hidden bg-purple text-white border-2 border-ink rounded-3xl shadow-pop-lg p-5 sm:p-10 grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-9">
          <span className="absolute -top-10 -right-10 w-[180px] h-[180px] bg-lime border-2 border-ink rounded-full opacity-90" />
          <div className="relative">
            <span className="inline-block bg-lime text-[#1A1440] border-2 border-ink rounded-full font-mono text-[12px] font-bold px-3 py-[5px] mb-4">
              DEEP DIVE · {featured.readingTime} MIN
            </span>
            <Link href={`/article/${featured.slug}`}>
              <h3 className="text-[clamp(30px,4vw,46px)] leading-[1.02] mb-4 hover:underline decoration-lime decoration-4 underline-offset-4">
                {featured.title}
              </h3>
            </Link>
            <p className="text-[16px] leading-relaxed text-[#e6e1ff] mb-6 max-w-[440px]">
              {featured.dek}
            </p>
            <Link
              href={`/writer/${featuredAuthor.username}`}
              className="flex items-center gap-3 w-fit"
            >
              <Avatar
                initials={featuredAuthor.initials}
                color="peach"
                size="md"
              />
              <div>
                <b className="text-[15px]">{featuredAuthor.name}</b>
                <div className="font-mono text-[12px] text-[#c7bfff]">
                  {featuredAuthor.role.toUpperCase()} · {featuredAuthor.company.toUpperCase()}
                </div>
              </div>
            </Link>
          </div>
          <div className="relative bg-card border-2 border-ink rounded-2xl text-ink p-6 flex flex-col justify-center">
            <div className="font-mono text-[11px] text-subtle font-bold mb-3">
              INSIDE THIS ESSAY
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[44px] leading-none">
                {featuredTopic.emoji}
              </span>
              <span className="text-[20px] font-bold leading-tight">
                {featuredTopic.name}
              </span>
            </div>
            <div className="font-mono text-[12px] text-subtle font-bold mb-5">
              {formatDate(featured.publishedAt).toUpperCase()} ·{" "}
              {featured.readingTime} MIN READ
            </div>
            <div className="flex gap-2 flex-wrap">
              {featured.tags.map((t) => (
                <span key={t} className="chip bg-sky text-[#1A1440]">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Fresh drops ── */}
        <SectionHead title="Fresh drops" note="// updated live" />
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 anim-stagger">
          {latest.map((a) => (
            <ArticleCard
              key={a.slug}
              article={a}
              author={cardData.authors.get(a.authorUsername)}
              topic={cardData.topics.get(a.topicSlug)}
            />
          ))}
        </section>

        {/* ── Trending ── */}
        <SectionHead title="Trending now 🔥" note="// last 24h" />
        <section className="bg-card border-2 border-ink rounded-3xl shadow-pop overflow-hidden">
          {trending.map((a, i) => {
            const author = cardData.authors.get(a.authorUsername);
            const topic = cardData.topics.get(a.topicSlug);
            if (!author || !topic) return null;
            return (
              <Link
                key={a.slug}
                href={`/article/${a.slug}`}
                className="grid grid-cols-[34px_1fr_auto] sm:grid-cols-[54px_1fr_auto] gap-3 sm:gap-4 items-center px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-ink last:border-b-0 hover:bg-bg transition-colors group"
              >
                <span className="text-[28px] font-bold text-purple text-center">
                  {i + 1}
                </span>
                <div>
                  <div className="font-mono text-[11px] text-subtle font-bold mb-1.5 break-words">
                    {author.name.toUpperCase()} · {topic.name.toUpperCase()} ·{" "}
                    {a.readingTime} MIN
                  </div>
                  <h4 className="text-[19px] font-semibold leading-tight group-hover:text-purple transition-colors">
                    {a.title}
                  </h4>
                </div>
                <span className="hidden sm:inline-block font-mono text-[12px] font-bold bg-sky text-[#1A1440] border border-ink/30 rounded-full px-2.5 py-1 whitespace-nowrap">
                  ▲ {formatCount(a.reactions)}
                </span>
              </Link>
            );
          })}
        </section>

        {/* ── More stories (dense list) + sponsored ── */}
        {moreStories.length > 0 && (
          <>
            <SectionHead title="More stories" note="// keep scrolling" />
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
              <div className="bg-card border-2 border-ink rounded-3xl shadow-pop overflow-hidden anim-stagger">
                {moreStories.map((a) => (
                  <ArticleCard
                    key={a.slug}
                    article={a}
                    variant="compact"
                    author={cardData.authors.get(a.authorUsername)}
                    topic={cardData.topics.get(a.topicSlug)}
                  />
                ))}
              </div>
              <div className="space-y-6 lg:sticky lg:top-24">
                <SponsoredCard />
                <NewsletterForm variant="card" />
              </div>
            </section>

            {/* pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 font-mono text-[13px] font-bold">
                {page > 1 && (
                  <Link href={`/?page=${page - 1}`} className="btn btn-sm">
                    ← Newer
                  </Link>
                )}
                <span className="text-subtle">
                  page {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`/?page=${page + 1}`} className="btn btn-sm">
                    Older →
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Topics ── */}
        <SectionHead title="Browse by topic" note="// pick your poison" id="topics" />
        <section className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-4">
          {allTopics.map((t) => (
            <Link
              key={t.slug}
              href={`/topic/${t.slug}`}
              className="card card-hover p-4 sm:p-5 flex items-center gap-3 min-w-0"
            >
              <span className="text-[28px] shrink-0">{t.emoji}</span>
              <div className="min-w-0">
                <div className="font-bold text-[16px] sm:text-[18px] leading-snug break-words">
                  {t.name}
                </div>
                <div className="font-mono text-[11px] text-subtle truncate">
                  #{t.slug}
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* ── Newsletter ── */}
        <SectionHead title="The Weekly Compile" note="// every friday" />
        <section className="relative overflow-hidden bg-lime text-[#1A1440] border-2 border-ink rounded-3xl shadow-pop-lg p-6 sm:p-11 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="relative z-10">
            <h2 className="text-[27px] sm:text-[36px] font-bold leading-none mb-2.5 text-[#1A1440]">
              Five sharp reads. Zero spam. ✦
            </h2>
            <p className="text-[16px] font-medium max-w-[420px] text-[#1A1440] leading-relaxed">
              Hand-picked by humans, delivered every Friday. Join 190,000
              engineers who actually open it.
            </p>
          </div>
          <div className="relative z-10">
            <NewsletterForm variant="lime" />
          </div>
        </section>
      </div>
    </>
  );
}

function Sticker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute border-2 border-ink rounded-xl shadow-pop font-bold text-[14px] px-4 py-3 bg-card ${className}`}
    >
      {children}
    </div>
  );
}