import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ArticleCard } from "@/components/ArticleCard";
import { SponsoredCard } from "@/components/SponsoredCard";
import { PartnerBanner } from "@/components/PartnerBanner";
import { SectionHead } from "@/components/SectionHead";
import { NewsletterForm } from "@/components/NewsletterForm";
import { MobileFeedView } from "@/components/MobileFeedView";
import { HeroBanner } from "@/components/HeroBanner";
import {
  getFeatured,
  getLatest,
  getTrending,
  getAuthor,
  getTopic,
  getAllTopics,
  getUserCount,
  preloadCardData,
} from "@/lib/queries";
import { formatCount, formatDate } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const allTopics = await getAllTopics();
  const featured = await getFeatured();
  const userCount = await getUserCount();

  // ── Clean Empty State when no articles exist yet ──
  if (!featured) {
    return (
      <>
        <HeroBanner userCount={userCount} />

        <div className="wrap py-6">
          <div className="rounded-3xl border-2 border-ink bg-card p-8 sm:p-12 text-center shadow-pop-lg max-w-3xl mx-auto my-6">
            <div className="text-[56px] mb-4">✍️</div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Be the first author on GoHackerz</h2>
            <p className="text-muted text-lg max-w-xl mx-auto mb-8">
              No articles have been published yet. Share your architecture decisions, incident write-ups, or technical teardowns with our growing community.
            </p>
            <Link href="/write" className="btn btn-purple text-lg px-8 py-4">
              Write the First Post ✦
            </Link>
          </div>

          <SectionHead title="Browse by topic" note="// pick your poison" id="topics" />
          <section className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-4 mb-16">
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
          <section className="relative overflow-hidden bg-lime text-[#1A1440] border-2 border-ink rounded-3xl shadow-pop-lg p-6 sm:p-11 grid md:grid-cols-[1fr_auto] gap-8 items-center mb-12">
            <div className="relative z-10">
              <h2 className="text-[27px] sm:text-[36px] font-bold leading-none mb-2.5 text-[#1A1440]">
                Five sharp reads. Zero spam. ✦
              </h2>
              <p className="text-[16px] font-medium max-w-[420px] text-[#1A1440] leading-relaxed">
                Hand-picked by humans, delivered every Friday. Built for engineers who want the signal, not the scroll.
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

  const isPlaceholderArticle = (value: string) => /TESTING|lorem ipsum|placeholder/i.test(value);
  const featuredAuthor = (await getAuthor(featured.authorUsername)) ?? {
    name: featured.authorUsername,
    initials: featured.authorUsername.slice(0, 2).toUpperCase(),
    username: featured.authorUsername,
    role: "Writer",
    company: "",
  };
  const featuredTopic = (await getTopic(featured.topicSlug)) ?? {
    name: featured.topicSlug,
    emoji: "📝",
    slug: featured.topicSlug,
  };

  const allArticles = (await getLatest()).filter((a) => !isPlaceholderArticle(`${a.title} ${a.dek}`));
  const feedArticles = allArticles.filter((a) => a.slug !== featured?.slug);
  const latest = feedArticles.slice(0, 3);
  const trending = (await getTrending(6))
    .filter((a) => !isPlaceholderArticle(`${a.title} ${a.dek}`))
    .slice(0, 4);

  const PAGE_SIZE = 12;
  const pageNum = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(feedArticles.length / PAGE_SIZE));
  const page = Math.min(pageNum, totalPages);
  const moreStories = feedArticles;

  const cardData = await preloadCardData([featured, ...feedArticles, ...trending].filter(Boolean));

  return (
    <>
      {/* ── Native Streamlined Mobile View ── */}
      <MobileFeedView
        articles={allArticles}
        trending={trending.length ? trending : allArticles.slice(0, 4)}
        topics={allTopics}
        authors={cardData.authors}
        topicsMap={cardData.topics}
        userCount={userCount}
      />

      {/* ── Rich Desktop Publication View ── */}
      <div className="hidden md:block">
        <HeroBanner userCount={userCount} />

        {/* ── Topic Quick Bar ── */}
        <div className="wrap mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-scroll py-2 px-1 -mx-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-subtle shrink-0 mr-1">
              TOPICS:
            </span>
            {allTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/topic/${t.slug}`}
                className="chip bg-card hover:bg-lime hover:text-[#1A1440] transition-colors shrink-0 text-[13px] py-1.5 px-3 border border-ink/20 shadow-pop-sm"
              >
                <span className="mr-1">{t.emoji}</span> {t.name}
              </Link>
            ))}
          </div>
        </div>

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
                    {featuredAuthor.role.toUpperCase()}
                  </div>
                </div>
              </Link>
            </div>
            {featured.coverImage ? (
              <Link
                href={`/article/${featured.slug}`}
                className="relative group overflow-hidden bg-card border-2 border-ink rounded-2xl shadow-pop flex flex-col justify-end min-h-[240px] sm:min-h-[280px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="relative p-4 sm:p-5 text-white z-10">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="chip bg-lime text-[#1A1440] font-bold text-[11px] border border-ink/30 shadow-pop-sm">
                      {featuredTopic.emoji} {featuredTopic.name}
                    </span>
                    <span className="font-mono text-[11px] text-white/90 font-bold">
                      {formatDate(featured.publishedAt).toUpperCase()} · {featured.readingTime} MIN READ
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
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
            )}
          </section>

          {/* ── Fresh drops ── */}
          {latest.length > 0 && (
            <>
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
            </>
          )}

          {/* ── Native Sponsored Partner Banner ── */}
          <PartnerBanner />

        {/* ── Trending ── */}
        {trending.length > 0 && (
          <>
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
          </>
        )}

        {/* ── More stories ── */}
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
              Hand-picked by humans, delivered every Friday. Built for engineers who want the signal, not the scroll.
            </p>
          </div>
          <div className="relative z-10">
            <NewsletterForm variant="lime" />
          </div>
        </section>
      </div>
      </div>
    </>
  );
}