import type { Block } from "@/lib/data";

export function ArticleBody({ content }: { content: Block[] }) {
  return (
    <div className="space-y-6">
      {content.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="text-[28px] font-bold tracking-tight pt-4 leading-tight"
              >
                {block.text}
              </h2>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-[18px] leading-[1.7] text-body"
              >
                {block.text}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-[6px] border-purple bg-card text-ink rounded-r-2xl border-2 border-ink shadow-pop px-6 py-5 text-[22px] font-semibold leading-snug"
              >
                “{block.text}”
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2.5 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[18px] leading-[1.6] text-body">
                    <span className="mt-2 shrink-0 w-2.5 h-2.5 rounded-[3px] bg-lime border-2 border-ink" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "code":
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
                <pre className="bg-[#0f0b24] text-[#e8e4ff] p-5 overflow-x-auto font-mono text-[13.5px] leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
