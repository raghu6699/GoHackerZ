import Link from "next/link";
import { SponsorImpression } from "@/components/SponsorImpression";
import { clickHref, type Campaign } from "@/lib/sponsors";

/**
 * Homepage partner banner, driven by a SponsorCampaign with placement
 * "banner" (see /admin/sponsors). With no live campaign it advertises the
 * slot itself instead of showing a made-up sponsor.
 */
export function PartnerBanner({ campaign }: { campaign: Campaign | null }) {
  if (!campaign) {
    return (
      <section className="relative overflow-hidden bg-card border-2 border-dashed border-ink/40 rounded-3xl p-6 sm:p-9 dotgrid my-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <span className="ad-disclosure mb-3">★ Partner slot available</span>
            <h3 className="text-[22px] sm:text-[28px] font-bold leading-tight text-ink mt-3 mb-2">
              Your company here
            </h3>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-muted">
              Reach the developers, writers and hackathon builders who read RepoRally. Every partner gets a monthly report of views and clicks.
            </p>
          </div>
          <Link href="/advertise" className="btn py-3.5 px-7 text-[15px] font-bold w-full lg:w-auto text-center shrink-0">
            Become a partner →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <SponsorImpression campaignId={campaign.id}>
      <section className="relative overflow-hidden bg-card border-2 border-ink rounded-3xl shadow-pop-lg p-6 sm:p-9 dotgrid my-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="ad-disclosure">★ SPONSORED PARTNER</span>
              {campaign.tagline && (
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple">
                  {campaign.tagline}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {campaign.logoUrl && (
                <span className="inline-flex h-11 items-center rounded-xl bg-white px-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={campaign.logoUrl} alt={campaign.sponsor} className="h-6 w-auto" />
                </span>
              )}
              <h3 className="text-[22px] sm:text-[28px] font-bold leading-tight text-ink">{campaign.headline}</h3>
            </div>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-muted mb-4">{campaign.body}</p>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-subtle mr-1">
                BY {campaign.sponsor.toUpperCase()}
                {campaign.tags.length > 0 && " ·"}
              </span>
              {campaign.tags.map((t) => (
                <span key={t} className="chip bg-bg text-ink text-[11px]">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <a
              href={clickHref(campaign.id)}
              target="_blank"
              rel="sponsored noopener"
              className="btn btn-purple py-3.5 px-7 text-[15px] font-bold shadow-pop w-full lg:w-auto text-center"
            >
              {campaign.ctaLabel} →
            </a>
          </div>
        </div>
      </section>
    </SponsorImpression>
  );
}
