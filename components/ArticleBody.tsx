import { codeToHtml } from "shiki";
import type { Block } from "@/lib/data";
import { parseInline } from "@/lib/content";

/** Inline markdown → styled React nodes (escaping is handled by React). */
function Inline({ text }: { text: string }) {
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

  return (
    <div className="reading space-y-6 max-w-[68ch]">
      {content.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="font-sans text-[28px] font-bold tracking-tight pt-4 leading-tight"
              >
                <Inline text={block.text} />
              </h2>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-[19px] leading-[1.75] text-body"
              >
                <Inline text={block.text} />
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-[6px] border-purple bg-card text-ink rounded-r-2xl border-2 border-ink shadow-pop px-6 py-5 text-[21px] font-semibold italic leading-snug"
              >
                “<Inline text={block.text} />”
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2.5 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[18px] leading-[1.7] text-body">
                    <span className="mt-2 shrink-0 w-2.5 h-2.5 rounded-[3px] bg-lime border-2 border-ink" />
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "code": {
            const html = codeHtml[i];
            return (
              <div
                key={i}
                className="rounded-2xl border-2 border-ink shadow-pop overflow-hidden"
              >
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
          default:
            return null;
        }
      })}
    </div>
  );
}

