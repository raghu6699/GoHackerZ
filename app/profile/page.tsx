import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Users, QrCode, ExternalLink } from "lucide-react";
import { getCurrentDbUser } from "@/lib/profile";
import {
  getUserArticles,
  getFollowingFeed,
  getFollowedAuthors,
  getUserSavedArticles,
  preloadCardData,
  type WithStatus,
} from "@/lib/queries";
import { getUserHackathonHistory } from "@/lib/hackathons";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ArticleCard } from "@/components/ArticleCard";
import { DeleteArticleButton } from "@/components/DeleteArticleButton";
import { Avatar } from "@/components/Avatar";
import type { AvatarColor } from "@/lib/data";

export const metadata: Metadata = { title: "Your profile — GoHackerz" };

const TABS = [
  { key: "edit", label: "Edit profile", emoji: "👤" },
  { key: "passports", label: "Passports & Credentials", emoji: "🎫" },
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

  const [posts, followedAuthors, savedArticles, userPassports] = await Promise.all([
    getUserArticles(user.id),
    getFollowedAuthors(user.id),
    getUserSavedArticles(user.id),
    getUserHackathonHistory(user.email),
  ]);
  const followingFeed =
    tab === "following" ? await getFollowingFeed(user.id) : [];
  const feedCardData = await preloadCardData(followingFeed);
  const savedCardData =
    tab === "saved" ? await preloadCardData(savedArticles) : { authors: new Map(), topics: new Map() };

  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const inProgress = posts.length - published;
  const totalCerts = userPassports.filter((p) => !!p.participant.certificate).length;
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
          <span className="chip bg-[#D4CEF5] text-[#1A1440]">{userPassports.length} passports</span>
          {totalCerts > 0 && <span className="chip bg-lime text-[#1A1440] font-bold">🏆 {totalCerts} certified</span>}
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

      {/* ── panel: passports & certifications ── */}
      {tab === "passports" && (
        <div className="anim space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Hacker Passports & Verified Credentials</h2>
              <p className="text-sm text-muted">
                Official digital boarding passes, competition standings, and verifiable certificates from GoHackerz hackathons.
              </p>
            </div>
            <Link href="/hackathons" className="btn btn-purple btn-sm">
              <span>Explore Arena</span> <Sparkles className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {userPassports.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1">
              {userPassports.map(({ hackathon, participant }) => {
                const cert = participant.certificate;
                const hasSub = !!participant.submission;

                return (
                  <div
                    key={participant.ticketNumber}
                    className="rounded-3xl border-2 border-ink bg-card p-6 sm:p-7 shadow-pop-lg relative overflow-hidden transition-all hover:shadow-pop-xl space-y-6"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple text-lime border-2 border-ink flex items-center justify-center font-bold text-xl shrink-0 shadow-pop-sm">
                          {cert ? (cert.type.startsWith("WINNER") ? "🏆" : "📜") : "🎫"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-lime text-[#1A1440] border border-ink">
                              {hackathon.status}
                            </span>
                            <span className="font-mono text-xs text-purple font-bold">
                              Ticket #{participant.ticketNumber}
                            </span>
                            {cert && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-brand-dark text-lime border border-ink">
                                {cert.type === "WINNER_FIRST"
                                  ? "★ GRAND CHAMPION"
                                  : cert.type === "WINNER_SECOND"
                                  ? "★ 1ST RUNNER UP"
                                  : cert.type === "WINNER_THIRD"
                                  ? "★ 2ND RUNNER UP"
                                  : cert.type === "TRACK_WINNER"
                                  ? "✦ TRACK CHAMPION"
                                  : "✓ VERIFIED"}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-ink dark:text-white leading-tight">
                            {hackathon.title}
                          </h3>
                          <p className="text-sm text-muted mt-1 leading-relaxed max-w-xl">
                            {hackathon.tagline}
                          </p>
                          
                          <div className="flex items-center gap-4 flex-wrap mt-3 text-xs font-mono text-body dark:text-[#D4CEF5]">
                            <span className="flex items-center gap-1 font-semibold text-purple">
                              <Sparkles className="w-3.5 h-3.5" /> Role: {participant.roleTitle}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Squad: {participant.teamName || "Solo Builder"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
                        <Link
                          href={`/hackathons/${hackathon.slug}/pass/${participant.ticketNumber}`}
                          className="btn btn-lime font-mono font-bold text-xs justify-center"
                        >
                          <QrCode className="w-4 h-4 mr-1.5" />
                          <span>View 3D Passport</span>
                        </Link>
                        <Link
                          href={`/hackathons/${hackathon.slug}`}
                          className="btn btn-ghost text-xs justify-center font-mono"
                        >
                          <span>Hackathon Arena</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Official Certificate & Award Showcase */}
                    {cert ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-bg border-2 border-ink/15 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-purple uppercase font-bold tracking-wider block">
                              OFFICIAL CREDENTIAL & DISTINCTION
                            </span>
                            <h4 className="text-lg font-bold text-ink dark:text-white mt-0.5">
                              {cert.awardTitle}
                            </h4>
                            <p className="text-xs text-muted mt-0.5">
                              {cert.projectName && <span>Project: <strong>{cert.projectName}</strong> · </span>}
                              Credential ID: <code className="font-mono text-purple font-bold">{cert.certNumber}</code>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/verify/${cert.certNumber}`}
                              className="btn btn-sm btn-purple font-mono text-xs font-bold whitespace-nowrap shadow-pop-sm"
                            >
                              <span>Verify & View ↗</span>
                            </Link>
                            <a
                              href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
                                `${cert.awardTitle} - ${cert.title}`
                              )}&organizationName=GoHackerz&issueYear=${new Date(
                                cert.issuedAt
                              ).getFullYear()}&issueMonth=${
                                new Date(cert.issuedAt).getMonth() + 1
                              }&certUrl=${encodeURIComponent(
                                `https://gohackerz.com/verify/${cert.certNumber}`
                              )}&certId=${encodeURIComponent(cert.certNumber)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm bg-[#0A66C2] hover:bg-[#004182] text-white font-mono text-xs font-bold whitespace-nowrap shadow-pop-sm flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                              </svg>
                              <span>LinkedIn</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : hasSub ? (
                      <div className="p-4 rounded-2xl bg-bg border border-ink/15 text-xs text-body flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple shrink-0" />
                          <span>
                            Project <strong>&quot;{participant.submission?.title}&quot;</strong> submitted & recorded. Verified credential pending judging closure.
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <div className="w-16 h-16 bg-[#17132a] text-lime rounded-2xl border-2 border-ink flex items-center justify-center text-3xl mx-auto mb-4 shadow-pop-sm">
                🎫
              </div>
              <h3 className="font-bold text-xl mb-2">No Hackathon Passports Yet</h3>
              <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
                You haven&apos;t registered for a GoHackerz hackathon yet. Join our flagship hackathon to build with edge & AI tools, earn your official 3D Holographic Hacker Passport, and win cash grants.
              </p>
              <Link href="/hackathons/shipathon-2026/register" className="btn btn-lime text-[#1A1440] font-bold">
                Register for Shipathon 2026 🚀
              </Link>
            </div>
          )}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/write?edit=${a.slug}`} className="btn btn-sm">
                      Edit →
                    </Link>
                    <DeleteArticleButton slug={a.slug} title={a.title} />
                  </div>
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