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

describe("blocksToHtml (editor hydration)", () => {
  it("escapes HTML-injecting code content", () => {
    const html = blocksToHtml([
      { type: "code", lang: "js", code: "</script><script>alert(1)</script>" },
    ]);
    expect(html).not.toContain("</script>");
    expect(html).toContain("&lt;/script&gt;");
  });
});
