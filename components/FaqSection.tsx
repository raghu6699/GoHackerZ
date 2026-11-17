import type { Faq } from "@/lib/seo-faqs";
import { faqJsonLd } from "@/lib/seo-faqs";
import { ldJson } from "@/lib/seo";

/** Visible FAQ accordion plus matching FAQPage JSON-LD. Server component. */
export function FaqSection({ faqs, title = "Frequently asked questions" }: { faqs: Faq[]; title?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="mt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd(faqs)) }} />
      <h2 id="faq-heading" className="text-[28px] font-bold tracking-tight">{title}</h2>
      <div className="mt-5 divide-y-2 divide-ink/10 rounded-2xl border-2 border-ink bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[17px]">
              {f.q}
              <span className="font-mono text-purple transition-transform group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
