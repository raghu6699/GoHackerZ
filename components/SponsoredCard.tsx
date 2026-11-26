import Link from "next/link";
import { SponsorImpression } from "@/components/SponsorImpression";
import { clickHref, type Campaign } from "@/lib/sponsors";

/**
 * SponsoredCard — native ad unit styled as a sticker card, driven by a
 * SponsorCampaign with placement "card" (see /admin/sponsors). The disclosure
 * badge is required and always rendered. With no live campaign it shows an
 * "advertise here" card instead of a made-up sponsor.
 */
export function SponsoredCard({ campaign }: { campaign: Campaign | null }) {
  if (!campaign) {
    return (
      <aside className="ad-card">
        <div className="px-5 pt-3 pb-2 border-b-2 border-dashed border-ink/20">
          <span className="ad-disclosure">★ Ad space</span>
        </div>
        <div className="p-5">
          <h4 className="text-[19px] font-bold leading-tight mb-2">Your company here</h4>
          <p className="text-[14px] leading-relaxed text-muted mb-4">
            Put your product or open roles in front of developers and hackathon builders.
          </p>
          <Link href="/advertise" className="btn btn-sm w-full justify-center">
            Advertise on RepoRally →
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <SponsorImpression campaignId={campaign.id}>
      <aside className="ad-card">
        <div className="px-5 pt-3 pb-2 border-b-2 border-dashed border-ink/20 flex items-center justify-between gap-3">
          <span className="ad-disclosure">★ Sponsored</span>
          <span className="font-mono text-[10px] font-bold text-subtle uppercase tracking-wider truncate">
            {campaign.sponsor}
          </span>
        </div>
        <div className="p-5">
          {campaign.logoUrl && (
            <div className="mb-3 inline-flex h-11 items-center rounded-xl bg-white px-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={campaign.logoUrl} alt={campaign.sponsor} className="h-6 w-auto" />
            </div>
          )}
          <h4 className="text-[19px] font-bold leading-tight mb-2">{campaign.headline}</h4>
          <p className="text-[14px] leading-relaxed text-muted mb-4">{campaign.body}</p>
          <a
            href={clickHref(campaign.id)}
            target="_blank"
            rel="sponsored noopener"
            className="btn btn-sm btn-purple w-full justify-center"
          >
            {campaign.ctaLabel} →
          </a>
        </div>
      </aside>
    </SponsorImpression>
  );
}
