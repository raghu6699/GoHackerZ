import { codeToHtml } from "shiki";
import type { Block } from "@/lib/data";
import { parseInline } from "@/lib/content";
import { CopyCodeButton } from "./CopyCodeButton";

/** Footnote reference numbering: first appearance order across all blocks. */
function buildFootnoteOrder(content: Block[]): Map<string, number> {
  const order = new Map<string, number>();
  const scan = (text: string) => {
    for (const m of text.matchAll(/\[\^([A-Za-z0-9_-]+)\]/g)) {
      if (!order.has(m[1])) order.set(m[1], order.size + 1);
    }
  };
  for (const b of content) {
    if (b.type === "p" || b.type === "h2" || b.type === "quote") scan(b.text);
    else if (b.type === "ul") b.items.forEach(scan);
  }
  return order;
}

/** Inline markdown → styled React nodes (escaping is handled by React). */
function Inline({
  text,
  footnum,
}: {
  text: string;
  footnum?: Map<string, number>;
}) {
  return (
    <>
      {parseInline(text).map((tok, i) => {
        switch (tok.t) {
          case "strong":
            return <strong key={i}>{tok.v}</strong>;
          case "em":
            return <em key={i}>{tok.v}</em>;
          case "code":
            return (
              <code
                key={i}
                className="bg-[rgba(124,92,255,0.12)] rounded-md px-1.5 py-0.5 font-mono text-[0.9em]"
              >
                {tok.v}
              </code>
            );
          case "link":
            return (
              <a
                key={i}
                href={tok.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple underline decoration-2 underline-offset-2 hover:text-pink transition-colors"
              >
                {tok.v}
              </a>
            );
          case "footref": {
            const num = footnum?.get(tok.id);
            if (!num) return <span key={i}>[{tok.id}]</span>; // dangling ref
            return (
              <sup key={i}>
                <a
                  href={`#fn-${tok.id}`}
                  id={`fnref-${tok.id}`}
                  title={tok.id}
                  className="text-purple font-bold text-[0.75em] mx-px hover:text-pink no-underline"
                >
                  [{num}]
                </a>
              </sup>
            );
          }
          default:
            return <span key={i}>{tok.v}</span>;
        }
      })}
    </>
  );
}

async function highlightCode(
  code: string,
  lang: string
): Promise<string | null> {
  try {
    return await codeToHtml(code, { lang: lang || "text", theme: "github-dark" });
  } catch {
    // unknown language — fall back to plain rendering
    try {
      return await codeToHtml(code, { lang: "text", theme: "github-dark" });
    } catch {
      return null;
    }
  }
}

export async function ArticleBody({ content }: { content: Block[] }) {
  // Pre-render syntax highlighting server-side (zero client JS).
  const codeHtml = await Promise.all(
    content.map((b) => (b.type === "code" ? highlightCode(b.code, b.lang) : null))
  );
  const footnum = buildFootnoteOrder(content);

  // Group consecutive images into gallery units; everything else renders solo.
  type Unit =
    | { kind: "single"; block: Block; idx: number }
    | { kind: "gallery"; imgs: Extract<Block, { type: "img" }>[] };
  const units: Unit[] = [];
  for (let i = 0; i < content.length; ) {
    const b = content[i];
    if (b.type === "img") {
      const imgs: Extract<Block, { type: "img" }>[] = [];
      while (i < content.length && content[i].type === "img") {
        imgs.push(content[i] as Extract<Block, { type: "img" }>);
        i++;
      }
      units.push({ kind: "gallery", imgs });
    } else {
      units.push({ kind: "single", block: b, idx: i });
      i++;
    }
  }

  return (
    <div className="reading space-y-6 max-w-[68ch]">
      {units.map((unit, u) => {
        if (unit.kind === "gallery") {
          const multi = unit.imgs.length > 1;
          return (
            <div
              key={`g${u}`}
              className={`gallery grid gap-3 ${
                multi ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {unit.imgs.map((img, gi) => (
                <figure key={gi} className={multi && img.caption ? "sm:col-span-2" : ""}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-2xl border-2 border-ink shadow-pop"
                  />
                  {img.caption && (
                    <figcaption className="font-mono text-[12px] text-subtle mt-2 text-center">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          );
        }

        const { block, idx } = unit;
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={idx}
                className="font-sans text-[28px] font-bold tracking-tight pt-4 leading-tight"
              >
                <Inline text={block.text} footnum={footnum} />
              </h2>
            );
          case "p":
            return (
              <p key={idx} className="leading-[1.75] text-body">
                <Inline text={block.text} footnum={footnum} />
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={idx}
                className="border-l-[6px] border-purple bg-card text-ink rounded-r-2xl border-2 border-ink shadow-pop px-6 py-5 font-semibold italic leading-snug"
              >
                “<Inline text={block.text} footnum={footnum} />”
              </blockquote>
            );
          case "ul":
            return (
              <ul key={idx} className="space-y-2.5 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 leading-[1.7] text-body">
                    <span className="mt-2 shrink-0 w-2.5 h-2.5 rounded-[3px] bg-lime border-2 border-ink" />
                    <span>
                      <Inline text={item} footnum={footnum} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "code": {
            const html = codeHtml[idx];
            return (
              <div
                key={idx}
                className="relative rounded-2xl border-2 border-ink shadow-pop overflow-hidden"
              >
                <CopyCodeButton code={block.code} />
                <div className="flex items-center gap-2 bg-brand-dark px-4 py-2.5">
                  <span className="w-3 h-3 rounded-full bg-pink border border-black/30" />
                  <span className="w-3 h-3 rounded-full bg-peach border border-black/30" />
                  <span className="w-3 h-3 rounded-full bg-lime border border-black/30" />
                  <span className="ml-2 font-mono text-[11px] text-white/80">
                    {block.lang}
                  </span>
                </div>
                {html ? (
                  <div
                    className="shiki-wrap"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <pre className="bg-[#0f0b24] text-[#e8e4ff] p-5 overflow-x-auto font-mono text-[13.5px] leading-relaxed">
                    <code>{block.code}</code>
                  </pre>
                )}
              </div>
            );
          }
          case "footnotes":
            if (block.items.length === 0) return null;
            return (
              <section
                key={idx}
                className="border-t-2 border-dashed border-ink/20 pt-5 mt-10"
              >
                <h2 className="font-mono text-[12px] text-subtle font-bold tracking-widest mb-4">
                  NOTES &amp; REFERENCES
                </h2>
                <ol className="space-y-2.5">
                  {block.items.map((f) => (
                    <li
                      key={f.id}
                      id={`fn-${f.id}`}
                      className="flex gap-2.5 text-[14px] leading-relaxed text-muted scroll-mt-24"
                    >
                      <a
                        href={`#fnref-${f.id}`}
                        title="Back to reference"
                        className="font-mono font-bold text-purple shrink-0 hover:text-pink"
                      >
                        [{footnum.get(f.id) ?? f.id}]
                      </a>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ol>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

