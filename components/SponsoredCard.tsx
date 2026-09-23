import Link from "next/link";

/**
 * SponsoredCard — native ad unit styled as a sticker card.
 * The disclosure badge is REQUIRED (FTC-style) and always rendered.
 * In production this is driven by the `campaigns` table; for the MVP
 * it renders demo sponsor content.
 */
export function SponsoredCard({
  sponsor = "Oxide Computer",
  headline = "Your servers, with the cloud's API",
  body = "Rack-scale hardware you can rent by the month. No hypervisor tax, no surprise egress bills.",
  ctaLabel = "See how it works",
  ctaHref = "https://oxide.computer",
}: {
  sponsor?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const isExternal = ctaHref.startsWith("http://") || ctaHref.startsWith("https://");

  return (
    <aside className="ad-card">
      <div className="px-5 pt-3 pb-2 border-b-2 border-dashed border-ink/20 flex items-center justify-between">
        <span className="ad-disclosure">★ Sponsored</span>
        <span className="font-mono text-[10px] font-bold text-subtle uppercase tracking-wider">
          {sponsor}
        </span>
      </div>
      <div className="p-5">
        <h4 className="text-[19px] font-bold leading-tight mb-2">{headline}</h4>
        <p className="text-[14px] leading-relaxed text-muted mb-4">{body}</p>
        <Link
          href={ctaHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="btn btn-sm btn-purple w-full justify-center"
        >
          {ctaLabel} →
        </Link>
      </div>
    </aside>
  );
}