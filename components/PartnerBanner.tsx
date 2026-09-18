import Link from "next/link";

export interface PartnerBannerProps {
  sponsor?: string;
  tagline?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  tags?: string[];
  logoEmoji?: string;
}

export function PartnerBanner({
  sponsor = "Oxide Computer",
  tagline = "FEATURED TECH PARTNER",
  headline = "Reinventing the rack for production engineers",
  description = "True cloud architecture built directly onto bare metal hardware. No hypervisor tax, zero surprise egress fees, and 100% open-source control planes.",
  ctaLabel = "Explore Oxide Rack →",
  ctaHref = "https://oxide.computer",
  tags = ["hardware", "cloud", "systems"],
  logoEmoji = "⚡",
}: PartnerBannerProps) {
  return (
    <section className="relative overflow-hidden bg-card border-2 border-ink rounded-3xl shadow-pop-lg p-6 sm:p-9 dotgrid my-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="ad-disclosure">★ SPONSORED PARTNER</span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple">
              {tagline}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl leading-none">{logoEmoji}</span>
            <h3 className="text-[22px] sm:text-[28px] font-bold leading-tight text-ink">
              {headline}
            </h3>
          </div>

          <p className="text-[15px] sm:text-[16px] leading-relaxed text-muted mb-4">
            {description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-subtle mr-1">
              BY {sponsor.toUpperCase()} ·
            </span>
            {tags.map((t) => (
              <span key={t} className="chip bg-bg text-ink text-[11px]">
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-auto">
          <Link
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-purple py-3.5 px-7 text-[15px] font-bold shadow-pop w-full lg:w-auto text-center"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
