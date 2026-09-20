import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import {
  getUserArticles,
  getFollowingFeed,
  getFollowedAuthors,
  getUserSavedArticles,
  preloadCardData,
  type WithStatus,
} from "@/lib/queries";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ArticleCard } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import type { AvatarColor } from "@/lib/data";

export const metadata: Metadata = { title: "Your profile — GoHackerz" };

const TABS = [
  { key: "edit", label: "Edit profile", emoji: "👤" },
  { key: "posts", label: "Your posts", emoji: "📝" },
  { key: "saved", label: "Saved articles", emoji: "★" },
  { key: "following", label: "Following", emoji: "💜" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-card text-ink",
  SUBMITTED: "bg-sky text-[#1A1440]",
  PUBLISHED: "bg-lime text-[#1A1440]",
  REJECTED: "bg-peach text-[#8a2b00]",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin");

  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "edit";

  const [posts, followedAuthors, savedArticles] = await Promise.all([
    getUserArticles(user.id),
    getFollowedAuthors(user.id),
    getUserSavedArticles(user.id),
  ]);
  const followingFeed =
    tab === "following" ? await getFollowingFeed(user.id) : [];
  const feedCardData = await preloadCardData(followingFeed);
  const savedCardData =
    tab === "saved" ? await preloadCardData(savedArticles) : { authors: new Map(), topics: new Map() };

  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const inProgress = posts.length - published;
  const initials = (user.name ?? user.email)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="wrap max-w-[860px] py-10">
      {/* ── identity header ── */}
      <header className="relative overflow-hidden bg-purple text-white border-2 border-ink rounded-3xl shadow-pop-lg p-7 sm:p-9 mb-6 dotgrid-light anim">
        <span
          className="absolute -top-12 -right-12 w-[170px] h-[170px] bg-lime border-2 border-ink rounded-full opacity-90 pointer-events-none"
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          <Avatar initials={initials} color="peach" size="xl" src={user.avatarUrl} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[clamp(26px,4vw,38px)] font-bold leading-tight tracking-tight">
              {user.name}
            </h1>
            <div className="font-mono text-[13px] text-[#d7d0ff] mt-1 mb-3">
              @{user.username} · {user.role.toLowerCase()}
            </div>
            <Link href={`/writer/${user.username}`} className="btn btn-sm bg-lime text-[#1A1440]">
              View public profile ↗
            </Link>
          </div>
        </div>
        <div className="relative flex gap-2.5 flex-wrap mt-5">
          <span className="chip bg-lime text-[#1A1440]">{published} published</span>
          <span className="chip bg-sky text-[#1A1440]">{inProgress} in progress</span>
          <span className="chip bg-peach text-[#1A1440]">{savedArticles.length} saved</span>
          <span className="chip bg-pink text-[#1A1440]">{followedAuthors.length} following</span>
        </div>
      </header>

      {/* ── tabs ── */}
      <nav className="flex gap-2 mb-6 flex-wrap" aria-label="Profile sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/profile${t.key === "edit" ? "" : `?tab=${t.key}`}`}
            className={`chip px-4 py-2 transition-all duration-150 ${
              tab === t.key
                ? "bg-purple text-white scale-105 shadow-pop"
                : "bg-card text-ink hover:-translate-y-[2px] shadow-pop-sm"
            }`}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.emoji} {t.label}
          </Link>
        ))}
      </nav>

      {/* ── panel: edit ── */}
      {tab === "edit" && (
        <div className="anim">
          <ProfileEditor
            initial={{
              username: user.username ?? "",
              name: user.name ?? "",
              bio: user.bio ?? "",
              company: user.company ?? "",
              avatarColor: (user.avatarColor as AvatarColor) || "purple",
              avatarUrl: user.avatarUrl,
              email: user.email,
            }}
          />
        </div>
      )}

      {/* ── panel: posts ── */}
      {tab === "posts" && (
        <div className="anim space-y-4">
          {posts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-semibold text-[17px] mb-4">No posts yet.</p>
              <Link href="/write" className="btn btn-purple">
                Write your first post ✦
              </Link>
            </div>
          ) : (
            (posts as WithStatus[]).map((a) => (
              <div key={a.slug} className="card p-5 anim">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <span className={`chip ${STATUS_STYLE[a.status] ?? "bg-card"} mb-2 inline-block`}>
                      {a.status}
                    </span>
                    <Link
                      href={a.status === "PUBLISHED" ? `/article/${a.slug}` : `/write?edit=${a.slug}`}
                      className="block text-[17px] font-bold hover:text-purple transition-colors truncate"
                    >
                      {a.title}
                    </Link>
                    <p className="text-[13px] text-muted truncate">{a.dek}</p>
                    {a.status === "REJECTED" && a.rejectionFeedback && (
                      <p className="font-mono text-[11px] text-[#8a2b00] mt-2 bg-peach rounded-lg px-3 py-1.5 inline-block">
                        Editor: {a.rejectionFeedback}
                      </p>
                    )}
                    {a.status === "SUBMITTED" && (
                      <p className="font-mono text-[11px] text-subtle mt-1">
                        Awaiting editorial review.
                      </p>
                    )}
                  </div>
                  {(a.status === "DRAFT" || a.status === "REJECTED") && (
                    <Link href={`/write?edit=${a.slug}`} className="btn btn-sm shrink-0">
                      Edit →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── panel: saved ── */}
      {tab === "saved" && (
        <div className="anim">
          {savedArticles.length > 0 ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 anim-stagger">
              {savedArticles.map((a) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  author={savedCardData.authors.get(a.authorUsername)}
                  topic={savedCardData.topics.get(a.topicSlug)}
                />
              ))}
            </section>
          ) : (
            <div className="card p-10 text-center">
              <p className="font-semibold text-[17px] mb-2">
                No saved articles yet.
              </p>
              <p className="text-[14px] text-muted mb-5">
                Click ★ Save on any essay to bookmark it for later.
              </p>
              <Link href="/" className="btn btn-purple">
                Explore articles →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── panel: following ── */}
      {tab === "following" && (
        <div className="anim">
          {followedAuthors.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {followedAuthors.map((a) => (
                <Link
                  key={a.username}
                  href={`/writer/${a.username}`}
                  className="chip bg-card text-ink hover:bg-bg transition-colors"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          )}
          {followingFeed.length > 0 ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 anim-stagger">
              {followingFeed.map((a) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  author={feedCardData.authors.get(a.authorUsername)}
                  topic={feedCardData.topics.get(a.topicSlug)}
                />
              ))}
            </section>
          ) : (
            <div className="card p-10 text-center">
              <p className="font-semibold text-[17px] mb-2">
                {followedAuthors.length === 0
                  ? "You aren't following anyone yet."
                  : "No new posts from your writers yet."}
              </p>
              <Link href="/" className="btn btn-purple">
                Discover writers →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}