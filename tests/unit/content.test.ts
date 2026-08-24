import { describe, it, expect } from "vitest";
import {
  parseBlocks,
  parseInline,
  serializeTiptapDoc,
  blocksToText,
  blocksToHtml,
} from "@/lib/content";

describe("parseBlocks", () => {
  it("parses paragraphs, headings, quotes and lists", () => {
    const text = [
      "First paragraph.",
      "",
      "## A heading",
      "",
      "> a quote",
      "",
      "- one",
      "- two",
      "Back in a paragraph, continued",
    ].join("\n");
    expect(parseBlocks(text)).toEqual([
      { type: "p", text: "First paragraph." },
      { type: "h2", text: "A heading" },
      { type: "quote", text: "a quote" },
      { type: "ul", items: ["one", "two"] },
      { type: "p", text: "Back in a paragraph, continued" },
    ]);
  });

  it("parses fenced code blocks with language", () => {
    const out = parseBlocks("```ts\nconst x: number = 1;\n```");
    expect(out).toEqual([{ type: "code", lang: "ts", code: "const x: number = 1;" }]);
  });

  it("closes an unclosed code fence instead of dropping the content", () => {
    const out = parseBlocks("```python\nprint('hi')");
    expect(out).toEqual([{ type: "code", lang: "python", code: "print('hi')" }]);
  });

  it("handles CRLF line endings", () => {
    expect(parseBlocks("a\r\n\r\nb")).toEqual([
      { type: "p", text: "a" },
      { type: "p", text: "b" },
    ]);
  });

  it("round-trips through blocksToText", () => {
    const blocks = parseBlocks("# intro\n\n## Head\n\n- a\n- b");
    // '# intro' is not valid markdown for our parser → plain paragraph
    expect(blocks[0]).toEqual({ type: "p", text: "# intro" });
    expect(parseBlocks(blocksToText(blocks))).toEqual(blocks);
  });
});

describe("parseInline (inline markdown)", () => {
  it("detects bold, italic, code and links", () => {
    expect(parseInline("a **b** *c* `d` [e](https://x.io) f")).toEqual([
      { t: "text", v: "a " },
      { t: "strong", v: "b" },
      { t: "text", v: " " },
      { t: "em", v: "c" },
      { t: "text", v: " " },
      { t: "code", v: "d" },
      { t: "text", v: " " },
      { t: "link", v: "e", href: "https://x.io" },
      { t: "text", v: " f" },
    ]);
  });

  it("returns plain text untouched", () => {
    expect(parseInline("no markup here")).toEqual([{ t: "text", v: "no markup here" }]);
  });
});

describe("serializeTiptapDoc", () => {
  it("serializes the full block vocabulary to storage format", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "big ", marks: [{ type: "bold" }] },
            { type: "text", text: "and ", marks: [{ type: "italic" }] },
            { type: "text", text: "code", marks: [{ type: "code" }] },
          ],
        },
        {
          type: "blockquote",
          content: [{ type: "paragraph", content: [{ type: "text", text: "wise" }] }],
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "two" }] }] },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "go" },
          content: [{ type: "text", text: "fmt.Println()" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a link", marks: [{ type: "link", attrs: { href: "https://y.dev" } }] },
          ],
        },
      ],
    };
    const md = serializeTiptapDoc(doc as never);
    expect(md).toBe(
      [
        "## Title",
        "**big** *and* `code`",
        "> wise",
        "- one\n- two",
        "```go\nfmt.Println()\n```",
        "[a link](https://y.dev)",
      ].join("\n\n")
    );
    // And the storage parser must accept exactly what the editor saves:
    expect(parseBlocks(md)).toEqual([
      { type: "h2", text: "Title" },
      { type: "p", text: "**big** *and* `code`" },
      { type: "quote", text: "wise" },
      { type: "ul", items: ["one", "two"] },
      { type: "code", lang: "go", code: "fmt.Println()" },
      { type: "p", text: "[a link](https://y.dev)" },
    ]);
  });
});

describe("images & galleries", () => {
  it("parses standalone image lines with optional captions", () => {
    expect(parseBlocks('![chart](https://x.io/c.png "Q3 latency")')).toEqual([
      { type: "img", alt: "chart", src: "https://x.io/c.png", caption: "Q3 latency" },
    ]);
    expect(parseBlocks("![diagram](https://x.io/d.png)")).toEqual([
      { type: "img", alt: "diagram", src: "https://x.io/d.png", caption: undefined },
    ]);
  });

  it("round-trips images through blocksToText and back", () => {
    const blocks = parseBlocks(
      'before\n\n![a](https://x.io/a.png "cap")\n\n![b](https://x.io/b.png)\n\nafter'
    );
    expect(blocks).toEqual([
      { type: "p", text: "before" },
      { type: "img", alt: "a", src: "https://x.io/a.png", caption: "cap" },
      { type: "img", alt: "b", src: "https://x.io/b.png", caption: undefined },
      { type: "p", text: "after" },
    ]);
    expect(parseBlocks(blocksToText(blocks))).toEqual(blocks);
  });

  it("serializes TipTap image nodes (title attr = caption) to storage format", () => {
    const md = serializeTiptapDoc({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://x.io/i.png", alt: "photo", title: "A caption" },
        },
      ],
    } as never);
    expect(md).toBe('![photo](https://x.io/i.png "A caption")');
    expect(parseBlocks(md)[0]).toEqual({
      type: "img",
      alt: "photo",
      src: "https://x.io/i.png",
      caption: "A caption",
    });
  });

  it("does not treat inline markdown links as images", () => {
    expect(parseBlocks("[not an image](https://x.io)")).toEqual([
      { type: "p", text: "[not an image](https://x.io)" },
    ]);
  });
});

describe("footnotes", () => {
  it("collects definitions into a trailing footnotes block and keeps refs inline", () => {
    const blocks = parseBlocks(
      "Claim one[^1].\n\n[^1]: The benchmark repo.\n[^2]: Personal communication."
    );
    expect(blocks[0]).toEqual({ type: "p", text: "Claim one[^1]." });
    expect(blocks[1]).toEqual({
      type: "footnotes",
      items: [
        { id: "1", text: "The benchmark repo." },
        { id: "2", text: "Personal communication." },
      ],
    });
  });

  it("tokenizes [^id] references distinctly from links", () => {
    expect(parseInline("see [^rust] and [docs](https://d.rs)")).toEqual([
      { t: "text", v: "see " },
      { t: "footref", id: "rust" },
      { t: "text", v: " and " },
      { t: "link", v: "docs", href: "https://d.rs" },
    ]);
  });

  it("round-trips a fully footnoted essay through storage format", () => {
    const original =
      "Latency lied to us[^lie].\n\n> Trust, but profile.\n\n[^lie]: p99, not p50.";
    const blocks = parseBlocks(original);
    expect(parseBlocks(blocksToText(blocks))).toEqual(blocks);
  });
});

describe("blocksToHtml (editor hydration)", () => {
  it("escapes HTML-injecting code content", () => {
    const html = blocksToHtml([
      { type: "code", lang: "js", code: "</script><script>alert(1)</script>" },
    ]);
    expect(html).not.toContain("</script>");
    expect(html).toContain("&lt;/script&gt;");
  });
});
