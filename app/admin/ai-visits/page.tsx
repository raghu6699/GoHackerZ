import { redirect } from "next/navigation";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";
import { BOTS, botInfo } from "@/lib/ai-bots";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "AI crawler visits — Admin | RepoRally", robots: { index: false, follow: false } };

const KIND_LABEL: Record<string, string> = {
  "ai-search": "AI search",
  "ai-assistant": "AI assistant (user-triggered)",
  "ai-training": "AI training",
  search: "Search engine",
};

function ago(d: Date) {
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 90) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/** Admin-only: which AI and search crawlers fetch which pages. */
export default async function AiVisitsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin?next=/admin/ai-visits");
  if (!isUserAdmin(user)) {
    return (
      <div className="wrap py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-muted">This page is restricted to platform administrators.</p>
      </div>
    );
  }

  const since30 = new Date(Date.now() - 30 * 86400_000);
  let error = "";
  let byBot: { bot: string; count: number; last: Date | null }[] = [];
  let topPaths: { path: string; count: number }[] = [];
  let recent: { id: string; bot: string; path: string; createdAt: Date }[] = [];
  let total = 0;

  if (!isDbAvailable()) {
    error = "Database not configured.";
  } else {
    try {
      const [g, p, r, t] = await Promise.all([
        prisma.aiBotVisit.groupBy({ by: ["bot"], where: { createdAt: { gte: since30 } }, _count: { _all: true }, _max: { createdAt: true } }),
        prisma.aiBotVisit.groupBy({ by: ["path"], where: { createdAt: { gte: since30 } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 15 }),
        prisma.aiBotVisit.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, bot: true, path: true, createdAt: true } }),
        prisma.aiBotVisit.count({ where: { createdAt: { gte: since30 } } }),
      ]);
      byBot = g.map((x) => ({ bot: x.bot, count: x._count._all, last: x._max.createdAt })).sort((a, b) => b.count - a.count);
      topPaths = p.map((x) => ({ path: x.path, count: x._count._all }));
      recent = r;
      total = t;
    } catch (e) {
      error = e instanceof Error && /does not exist|relation/i.test(e.message)
        ? "The AiBotVisit table has not been created yet."
        : "Could not load crawler visits.";
    }
  }

  const oai = byBot.find((b) => b.bot === "OAI-SearchBot");
  const seen = new Set(byBot.map((b) => b.bot));
  const notSeen = BOTS.filter((b) => !seen.has(b.name)).map((b) => b.name);

  return (
    <div className="wrap max-w-5xl py-10 space-y-8">
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Admin</div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">AI crawler visits</h1>
        <p className="mt-2 text-muted">Pages fetched by AI and search crawlers in the last 30 days, identified by user agent. No visitor data is stored.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border-2 border-ink bg-card p-6 font-semibold">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">OAI-SearchBot (ChatGPT search)</div>
              <div className="mt-2 text-2xl font-bold">{oai ? `${oai.count} visits` : "Not seen yet"}</div>
              <div className="text-sm text-muted">{oai?.last ? `Last seen ${ago(oai.last)}` : "Appears once ChatGPT search indexes the site"}</div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">All crawler visits, 30 days</div>
              <div className="mt-2 text-2xl font-bold">{total}</div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">Crawlers seen</div>
              <div className="mt-2 text-2xl font-bold">{byBot.length} of {BOTS.length}</div>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold mb-3">By crawler</h2>
            <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-card">
              <table className="w-full text-sm">
                <thead><tr className="text-left font-mono text-xs uppercase text-subtle"><th className="p-3">Crawler</th><th className="p-3">Vendor</th><th className="p-3">Type</th><th className="p-3 text-right">Visits</th><th className="p-3">Last seen</th></tr></thead>
                <tbody>
                  {byBot.length === 0 && <tr><td className="p-3 text-muted" colSpan={5}>No crawler visits recorded yet.</td></tr>}
                  {byBot.map((b) => {
                    const info = botInfo(b.bot);
                    return (
                      <tr key={b.bot} className="border-t border-ink/10">
                        <td className="p-3 font-bold">{b.bot}</td>
                        <td className="p-3">{info?.vendor}</td>
                        <td className="p-3">{info ? KIND_LABEL[info.kind] : ""}</td>
                        <td className="p-3 text-right font-mono">{b.count}</td>
                        <td className="p-3 text-muted">{b.last ? ago(b.last) : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {notSeen.length > 0 && <p className="mt-2 text-xs text-muted">Not seen in 30 days: {notSeen.join(", ")}</p>}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Most fetched pages</h2>
            <div className="rounded-2xl border-2 border-ink bg-card divide-y divide-ink/10">
              {topPaths.length === 0 && <div className="p-3 text-sm text-muted">Nothing yet.</div>}
              {topPaths.map((p) => (
                <div key={p.path} className="flex justify-between gap-4 p-3 text-sm"><span className="font-mono break-all">{p.path}</span><span className="font-mono">{p.count}</span></div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Latest 100 visits</h2>
            <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-card">
              <table className="w-full text-sm">
                <tbody>
                  {recent.map((v) => (
                    <tr key={v.id} className="border-t border-ink/10 first:border-0">
                      <td className="p-3 whitespace-nowrap text-muted">{ago(v.createdAt)}</td>
                      <td className="p-3 font-bold whitespace-nowrap">{v.bot}</td>
                      <td className="p-3 font-mono break-all">{v.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
