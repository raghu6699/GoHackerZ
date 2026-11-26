import { redirect } from "next/navigation";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";
import { PLACEMENTS } from "@/lib/sponsors";
import { createCampaign, updateCampaign, setCampaignActive } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Sponsors — Admin | RepoRally", robots: { index: false, follow: false } };

type Row = Awaited<ReturnType<typeof loadCampaigns>>[number];
type Stats = { impressions: number; clicks: number };

function loadCampaigns() {
  return prisma.sponsorCampaign.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
}

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const inputDate = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "");
const ctr = (s: Stats) => (s.impressions > 0 ? `${((s.clicks / s.impressions) * 100).toFixed(1)}%` : "–");
const placementLabel = (p: string) => PLACEMENTS.find((x) => x.id === p)?.label ?? p;

function status(c: Row, now: Date): { label: string; cls: string } {
  if (!c.active) return { label: "Paused", cls: "bg-bg" };
  if (c.startsAt > now) return { label: "Scheduled", cls: "bg-sky" };
  if (c.endsAt && c.endsAt <= now) return { label: "Ended", cls: "bg-bg" };
  return { label: "Live", cls: "bg-lime text-[#1A1440]" };
}

const inputCls = "w-full rounded-xl border-2 border-ink bg-bg px-3 py-2 text-sm";
const labelCls = "block font-mono text-[11px] font-bold uppercase tracking-wider text-subtle mb-1";

function CampaignFields({ c }: { c?: Row }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <label><span className={labelCls}>Sponsor *</span><input name="sponsor" required defaultValue={c?.sponsor} className={inputCls} /></label>
      <label><span className={labelCls}>Placement *</span>
        <select name="placement" defaultValue={c?.placement ?? "card"} className={inputCls}>
          {PLACEMENTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2"><span className={labelCls}>Headline *</span><input name="headline" required maxLength={140} defaultValue={c?.headline} className={inputCls} /></label>
      <label className="sm:col-span-2"><span className={labelCls}>Text *</span><textarea name="body" required maxLength={400} rows={3} defaultValue={c?.body} className={inputCls} /></label>
      <label><span className={labelCls}>Button label *</span><input name="ctaLabel" required maxLength={40} defaultValue={c?.ctaLabel} className={inputCls} /></label>
      <label><span className={labelCls}>Link (sponsor site) *</span><input name="url" type="url" required defaultValue={c?.url} placeholder="https://" className={inputCls} /></label>
      <label><span className={labelCls}>Logo (path or URL)</span><input name="logoUrl" defaultValue={c?.logoUrl ?? ""} placeholder="/events/logo.png" className={inputCls} /></label>
      <label><span className={labelCls}>Tagline (banner)</span><input name="tagline" maxLength={60} defaultValue={c?.tagline ?? ""} className={inputCls} /></label>
      <label><span className={labelCls}>Tags (banner, comma separated)</span><input name="tags" defaultValue={c?.tags.join(", ")} className={inputCls} /></label>
      <label><span className={labelCls}>Price charged (₹)</span><input name="priceInr" inputMode="numeric" pattern="\d*" defaultValue={c?.priceInr ?? ""} className={inputCls} /></label>
      <label><span className={labelCls}>Starts</span><input name="startsAt" type="date" defaultValue={inputDate(c?.startsAt ?? null)} className={inputCls} /></label>
      <label><span className={labelCls}>Ends (leave empty to run until paused)</span><input name="endsAt" type="date" defaultValue={inputDate(c?.endsAt ?? null)} className={inputCls} /></label>
      <label className="sm:col-span-2"><span className={labelCls}>Private notes (invoice, contact)</span><textarea name="notes" rows={2} defaultValue={c?.notes ?? ""} className={inputCls} /></label>
    </div>
  );
}

/** Admin-only: sponsor campaigns, their placements and their results. */
export default async function SponsorsAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin?next=/admin/sponsors");
  if (!isUserAdmin(user)) {
    return (
      <div className="wrap py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-muted">This page is restricted to platform administrators.</p>
      </div>
    );
  }
  const { error: formError } = await searchParams;

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86400_000);
  let error = "";
  let campaigns: Row[] = [];
  const all = new Map<string, Stats>();
  const last30 = new Map<string, Stats>();

  if (!isDbAvailable()) {
    error = "Database not configured.";
  } else {
    try {
      const [rows, totals, recent] = await Promise.all([
        loadCampaigns(),
        prisma.sponsorEvent.groupBy({ by: ["campaignId", "kind"], _count: { _all: true } }),
        prisma.sponsorEvent.groupBy({ by: ["campaignId", "kind"], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
      ]);
      campaigns = rows;
      for (const [map, groups] of [[all, totals], [last30, recent]] as const) {
        for (const g of groups) {
          const s = map.get(g.campaignId) ?? { impressions: 0, clicks: 0 };
          if (g.kind === "impression") s.impressions = g._count._all;
          if (g.kind === "click") s.clicks = g._count._all;
          map.set(g.campaignId, s);
        }
      }
    } catch (e) {
      error = e instanceof Error && /does not exist|relation/i.test(e.message)
        ? "The sponsor tables have not been created yet. Run scripts/sponsors.sql in the Supabase SQL editor."
        : "Could not load sponsor campaigns.";
    }
  }

  const empty: Stats = { impressions: 0, clicks: 0 };
  const liveRevenue = campaigns.filter((c) => status(c, now).label === "Live").reduce((sum, c) => sum + (c.priceInr ?? 0), 0);

  return (
    <div className="wrap max-w-5xl py-10 space-y-8">
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-purple">Admin</div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Sponsors</h1>
        <p className="mt-2 text-muted">
          Paid placements and how they perform. An impression is counted when at least half of the ad is on screen; clicks go through a tracked link that adds UTM tags. Known bots are never counted.
        </p>
      </div>

      {formError && <div className="rounded-2xl border-2 border-ink bg-peach p-4 font-semibold text-[#1A1440]">{formError}</div>}

      {error ? (
        <div className="rounded-2xl border-2 border-ink bg-card p-6 font-semibold">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">Live campaigns</div>
              <div className="mt-2 text-2xl font-bold">{campaigns.filter((c) => status(c, now).label === "Live").length}</div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">Impressions / clicks, 30 days</div>
              <div className="mt-2 text-2xl font-bold">
                {[...last30.values()].reduce((n, s) => n + s.impressions, 0)} / {[...last30.values()].reduce((n, s) => n + s.clicks, 0)}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-card p-5">
              <div className="font-mono text-xs text-subtle uppercase">Booked on live campaigns</div>
              <div className="mt-2 text-2xl font-bold">₹{liveRevenue.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold mb-3">Campaigns</h2>
            <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-xs uppercase text-subtle">
                    <th className="p-3">Sponsor</th><th className="p-3">Placement</th><th className="p-3">Status</th><th className="p-3">Runs</th>
                    <th className="p-3 text-right">Views 30d</th><th className="p-3 text-right">Clicks 30d</th><th className="p-3 text-right">CTR 30d</th>
                    <th className="p-3 text-right">All-time views / clicks</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 && <tr><td className="p-3 text-muted" colSpan={9}>No campaigns yet. Create one below.</td></tr>}
                  {campaigns.map((c) => {
                    const st = status(c, now);
                    const s30 = last30.get(c.id) ?? empty;
                    const sAll = all.get(c.id) ?? empty;
                    return (
                      <tr key={c.id} className="border-t border-ink/10 align-top">
                        <td className="p-3 font-bold">{c.sponsor}{c.priceInr != null && <div className="font-mono text-xs font-normal text-muted">₹{c.priceInr.toLocaleString("en-IN")}</div>}</td>
                        <td className="p-3">{placementLabel(c.placement)}</td>
                        <td className="p-3"><span className={`chip text-[11px] ${st.cls}`}>{st.label}</span></td>
                        <td className="p-3 whitespace-nowrap text-muted">{fmtDate(c.startsAt)} → {c.endsAt ? fmtDate(c.endsAt) : "open"}</td>
                        <td className="p-3 text-right font-mono">{s30.impressions}</td>
                        <td className="p-3 text-right font-mono">{s30.clicks}</td>
                        <td className="p-3 text-right font-mono">{ctr(s30)}</td>
                        <td className="p-3 text-right font-mono">{sAll.impressions} / {sAll.clicks}</td>
                        <td className="p-3">
                          <form action={setCampaignActive}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                            <button className="btn btn-sm">{c.active ? "Pause" : "Resume"}</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {campaigns.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Edit a campaign</h2>
              {campaigns.map((c) => (
                <details key={c.id} className="rounded-2xl border-2 border-ink bg-card">
                  <summary className="cursor-pointer p-4 font-bold">{c.sponsor} · {placementLabel(c.placement)}</summary>
                  <form action={updateCampaign} className="border-t-2 border-ink/10 p-4 space-y-4">
                    <CampaignFields c={c} />
                    <button className="btn btn-purple">Save changes</button>
                  </form>
                </details>
              ))}
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold mb-3">New campaign</h2>
            <form action={createCampaign} className="rounded-2xl border-2 border-ink bg-card p-5 space-y-4">
              <CampaignFields />
              <button className="btn btn-purple">Create campaign</button>
            </form>
            <ul className="mt-3 text-xs text-muted space-y-1">
              {PLACEMENTS.map((p) => <li key={p.id}><b>{p.label}:</b> {p.where}. If several campaigns share a placement, each page view shows one at random.</li>)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
