import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHackathonBySlug, getAllSubmissions } from "@/lib/hackathons";
import { Trophy, Code2, ExternalLink, Video, Presentation, Sparkles, ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) return { title: "Submissions Not Found" };

  return {
    title: `Project Showcase — ${hackathon.title} — GoHackerz`,
    description: `Explore all projects and technical submissions for the ${hackathon.title}.`,
  };
}

export default async function HackathonSubmissionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);

  if (!hackathon) {
    notFound();
  }

  const submissions = await getAllSubmissions(hackathon.id);

  return (
    <div className="min-h-screen py-8 sm:py-14">
      <div className="wrap max-w-5xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/hackathons/${slug}`}
            className="font-mono text-xs font-bold text-muted hover:text-purple transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO EVENT OVERVIEW
          </Link>
          <span className="font-mono text-xs text-lime font-bold">
            {submissions.length} PROJECTS SUBMITTED
          </span>
        </div>

        {/* Header */}
        <div className="bg-brand-dark text-white rounded-3xl p-7 sm:p-10 border-2 border-ink shadow-pop-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/20 border border-lime text-lime font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>COMMUNITY SHOWCASE & DELIBERATION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Project Showcase Gallery
          </h1>

          <p className="text-sm sm:text-base text-[#D4CEF5] max-w-2xl leading-relaxed">
            Discover the apps, tools, and autonomous agent swarms built by engineers during the{" "}
            {hackathon.title}. Test live demos, inspect code repos, and view interactive Gamma pitch
            decks.
          </p>
        </div>

        {/* Submissions Grid */}
        {submissions.length === 0 ? (
          <div className="bg-card border-2 border-ink shadow-pop-sm rounded-3xl p-12 text-center space-y-3">
            <h3 className="text-xl font-bold text-ink">No submissions yet</h3>
            <p className="text-sm text-body">
              Be the first team to lock in your project submission!
            </p>
            <div className="pt-2">
              <Link
                href={`/hackathons/${slug}/submit`}
                className="btn btn-lime text-brand-dark font-mono text-xs font-bold"
              >
                SUBMIT YOUR PROJECT →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-card border-2 border-ink shadow-pop-lg rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-purple transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-purple/15 text-purple font-mono text-[11px] font-bold rounded-md border border-purple/30">
                      TRACK: {sub.trackId.toUpperCase()}
                    </span>
                    {sub.ticketNumber && (
                      <Link
                        href={`/hackathons/${slug}/pass/${sub.ticketNumber}`}
                        className="font-mono text-[11px] text-muted hover:text-purple underline font-bold"
                      >
                        #{sub.ticketNumber}
                      </Link>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xl text-ink leading-snug">{sub.title}</h3>
                    <p className="font-mono text-xs text-purple font-semibold mt-1">
                      {sub.teamName ? `By ${sub.teamName}` : `By ${sub.authorName}`}
                    </p>
                  </div>

                  <p className="text-sm text-body leading-relaxed">{sub.tagline}</p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sub.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-bg text-subtle font-mono text-[10px] font-bold rounded border border-ink/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lightweight Media / Link Bar */}
                <div className="pt-4 border-t border-ink/10 flex flex-wrap items-center gap-2">
                  {sub.demoUrl && (
                    <a
                      href={sub.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-lime text-brand-dark font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>DEMO</span>
                    </a>
                  )}

                  {sub.repoUrl && (
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-bg border border-ink/20 hover:border-ink text-ink font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>CODE</span>
                    </a>
                  )}

                  {sub.gammaUrl && (
                    <a
                      href={sub.gammaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-purple/15 hover:bg-purple hover:text-white text-purple border border-purple/30 font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <Presentation className="w-3.5 h-3.5" />
                      <span>PITCH DECK</span>
                    </a>
                  )}

                  {sub.videoUrl && (
                    <a
                      href={sub.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-pink/15 hover:bg-pink hover:text-white text-pink border border-pink/30 font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>VIDEO</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
