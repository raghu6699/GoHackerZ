"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { topics } from "@/lib/data";
import type { Block } from "@/lib/data";
import { blocksToHtml, blocksToText, parseBlocks, serializeTiptapDoc } from "@/lib/content";

export interface EditorInitial {
  slug: string;
  title: string;
  dek: string;
  topicSlug: string;
  content: Block[];
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  scheduledAt: Date | string | null;
}

const CODE_LANGS = [
  "text", "typescript", "javascript", "python", "go", "rust",
  "sql", "bash", "json", "yaml", "html", "css",
];

const lowlight = createLowlight(common);

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded-lg border-2 font-bold text-[13px] transition-colors ${
        active
          ? "bg-purple text-white border-purple is-active"
          : "bg-card border-ink/15 text-ink hover:border-purple"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onLinkClick,
  onImageUploadClick,
}: {
  editor: Editor | null;
  onLinkClick: () => void;
  onImageUploadClick: () => void;
}) {
  if (!editor) return null;


  const currentLang = (editor.getAttributes("codeBlock").language as string) || "text";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </ToolbarButton>
      <span className="italic">
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </ToolbarButton>
      </span>
      <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        Code
      </ToolbarButton>
      <ToolbarButton title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        Heading
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        Quote
      </ToolbarButton>
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Bullets
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        Numbered
      </ToolbarButton>
      <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        Code block
      </ToolbarButton>
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={onLinkClick}>
        Link
      </ToolbarButton>
      <ToolbarButton title="Insert image from file" onClick={onImageUploadClick}>
        Image
      </ToolbarButton>
      <span className="grow" />
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </ToolbarButton>
      {editor.isActive("codeBlock") && (
        <select
          value={currentLang}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
          }
          className="border-2 border-ink/15 rounded-lg px-2 py-1 text-[12px] bg-card outline-none"
        >
          {CODE_LANGS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}


// ── Autosave & crash recovery (localStorage-backed) ──────────

interface DraftSnapshot {
  title: string;
  dek: string;
  topicSlug: string;
  body: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  scheduledAt: string;
  savedAt: number;
}

function readSnapshot(key: string): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DraftSnapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(key: string, s: Omit<DraftSnapshot, "savedAt">): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ...s, savedAt: Date.now() }));
  } catch {
    /* quota/private mode — autosave is best-effort */
  }
}

function clearSnapshot(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function WriteEditor({ initial }: { initial?: EditorInitial }) {
  const router = useRouter();
  const editing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [dek, setDek] = useState(initial?.dek ?? "");
  const [topic, setTopic] = useState(initial?.topicSlug ?? topics[0].slug);
  const [body, setBody] = useState(
    initial?.content ? blocksToText(initial.content) : ""
  );
  const [coverUrl, setCoverUrl] = useState(initial?.coverImage ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [schedule, setSchedule] = useState(
    initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : ""
  );

  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  const activeTopic = topics.find((t) => t.slug === topic)!;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        codeBlock: false, // replaced by lowlight-powered CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "text" }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: "Tell the story — use the toolbar for headings, lists, quotes and code.",
      }),
      Link.configure({ openOnClick: false }),
    ],
    content: initial?.content ? blocksToHtml(initial.content) : "",
    immediatelyRender: false, // SSR-safe hydration
    editorProps: {
      attributes: {
        class: "min-h-[420px] focus:outline-none text-[16px] leading-[1.75]",
        "data-testid": "article-editor",
      },
    },
    onUpdate({ editor: ed }) {
      setBody(serializeTiptapDoc(ed.getJSON()));
    },
  });

  // ── Inline essay images: reuse the cover-upload storage path ──
  const imgInputRef = useRef<HTMLInputElement>(null);

  function insertImageNode(src: string, caption: string) {
    editor
      ?.chain()
      .focus()
      .setImage({
        src,
        alt: caption || "essay illustration",
        title: caption || undefined,
      })
      .run();
  }

  async function handleInlineImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    setError(null);
    setPopover({ kind: "image", src: "", caption: "", busy: true });
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/uploads/cover", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPopover({ kind: "image", src: data.url, caption: "", busy: false });
    } catch (err) {
      setPopover(null);
      setError(err instanceof Error ? err.message : "Image upload failed");
    }
  }

  // ── Inline link / image popovers (no native window.prompt) ────
  const [popover, setPopover] = useState<
    | { kind: "link"; url: string }
    | { kind: "image"; src: string; caption: string; busy: boolean }
    | null
  >(null);

  function openLinkPopover() {
    if (!editor) return;
    const existing = (editor.getAttributes("link").href as string) ?? "";
    setPopover({ kind: "link", url: existing });
  }

  function applyLink() {
    if (!editor || !popover || popover.kind !== "link") return;
    const url = popover.url.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setPopover(null);
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setPopover(null);
  }

  function applyImage() {
    if (!editor || !popover || popover.kind !== "image") return;
    const src = popover.src.trim();
    if (!src) return;
    editor.chain().focus().setImage({
      src,
      alt: popover.caption || "essay illustration",
      title: popover.caption || undefined,
    }).run();
    setPopover(null);
  }

  // ── Autosave: debounced localStorage snapshots after first change ──
  const draftKey = `gh-draft:${initial?.slug ?? "new"}`;
  const [recovered, setRecovered] = useState<DraftSnapshot | null>(null);
  const mountSig = useRef<string | null>(null);

  // One-time recovery check on mount
  useEffect(() => {
    const snap = readSnapshot(draftKey);
    if (!snap) return;
    if (!snap.title && !snap.body && !snap.dek) {
      clearSnapshot(draftKey);
      return;
    }
    setRecovered(snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sig = JSON.stringify([
      title, dek, topic, body, coverUrl, seoTitle, seoDescription, schedule,
    ]);
    if (mountSig.current === null) {
      mountSig.current = sig; // don't autosave the pristine mount state
      return;
    }
    if (sig === mountSig.current) return;
    const t = setTimeout(
      () =>
        writeSnapshot(draftKey, {
          title,
          dek,
          topicSlug: topic,
          body,
          coverImage: coverUrl,
          seoTitle,
          seoDescription,
          scheduledAt: schedule,
        }),
      1200
    );
    return () => clearTimeout(t);
  }, [title, dek, topic, body, coverUrl, seoTitle, seoDescription, schedule, draftKey]);

  function restoreDraft(snap: DraftSnapshot) {
    setTitle(snap.title);
    setDek(snap.dek);
    setTopic(snap.topicSlug || topics[0].slug);
    setBody(snap.body);
    setCoverUrl(snap.coverImage ?? "");
    setSeoTitle(snap.seoTitle ?? "");
    setSeoDescription(snap.seoDescription ?? "");
    setSchedule(snap.scheduledAt ?? "");
    if (editor && snap.body) {
      editor.commands.setContent(blocksToHtml(parseBlocks(snap.body)));
    }
    setRecovered(null);
  }

  function discardRecovered() {
    clearSnapshot(draftKey);
    setRecovered(null);
  }


  function payload(draft: boolean) {
    return {
      title,
      dek,
      topicSlug: topic,
      body,
      draft,
      coverImage: coverUrl || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      scheduledAt: schedule ? new Date(schedule).toISOString() : null,
    };
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/uploads/cover", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function saveDraft() {
    if (!title.trim()) return;
    setBusy("save");
    setError(null);
    try {
      let slug = initial?.slug;
      if (slug) {
        const res = await fetch(`/api/articles/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload(true),
            readingTime,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      } else {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload(true)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        slug = data.slug;
      }
      clearSnapshot(draftKey);
      router.push("/drafts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy("");
    }
  }

  async function publishOrSubmit() {
    if (!title.trim()) return;
    setBusy("publish");
    setError(null);
    try {
      if (editing && initial?.slug) {
        // update, then run it through the pipeline
        await fetch(`/api/articles/${initial.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload(false), readingTime }),
        });
        const res = await fetch(`/api/articles/${initial.slug}/submit`, { method: "POST" });
        const data = await res.json();
        if (res.status === 401) {
          setError("You need to be signed in.");
          setBusy("");
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed");
        clearSnapshot(draftKey);
        if (data.status === "SUBMITTED") {
          router.push("/drafts");
        } else {
          router.push(`/article/${initial.slug}`);
        }
        router.refresh();
        return;
      }

      // brand-new article
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(false)),
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("You need to sign in before publishing.");
        setBusy("");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      clearSnapshot(draftKey);
      router.push(data.status === "SUBMITTED" ? "/drafts" : `/article/${data.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy("");
    }
  }
  return (
    <div className="wrap py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <span className="chip bg-lime mb-2">
            {editing ? "✎ editing draft" : "✎ Draft"}
          </span>
          <h1 className="text-[32px] font-bold">
            {editing ? "Edit your post" : "Write a post"}
          </h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-[12px] text-subtle">
            {words} words · {readingTime} min
          </span>
          <button type="button" onClick={saveDraft} disabled={!title.trim() || busy !== ""} className="btn btn-sm disabled:opacity-40">
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" onClick={publishOrSubmit} disabled={!title.trim() || busy !== ""} className="btn btn-purple disabled:opacity-40">
            {busy === "publish" ? "Working…" : editing ? "Submit →" : "Publish ✦"}
          </button>
        </div>
      </div>

      {recovered && (
        <div className="font-mono text-[12px] bg-sky border-2 border-ink rounded-xl px-4 py-2.5 mb-5 flex items-center gap-3 justify-between flex-wrap">
          <span>
            💾 Unsaved draft from {new Date(recovered.savedAt).toLocaleString()} found.
          </span>
          <span className="flex gap-2">
            <button type="button" className="btn btn-sm" onClick={() => restoreDraft(recovered)}>
              Restore
            </button>
            <button type="button" className="btn btn-sm" onClick={discardRecovered}>
              Discard
            </button>
          </span>
        </div>
      )}

      {error && (
        <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-4 py-2.5 text-[#8a2b00] mb-5">
          ⚠ {error}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* editor */}
        <section className="card p-6 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The three assumptions destroying your…"
            className="w-full text-[26px] font-bold outline-none placeholder:text-[#c3bfe0] bg-transparent"
          />
          <textarea
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            placeholder="One or two sentences that make someone stop scrolling."
            rows={2}
            className="w-full text-[15px] outline-none resize-none placeholder:text-[#c3bfe0] bg-transparent"
          />
          <div>
            <span className="font-mono text-[11px] text-subtle font-bold">TOPIC</span>
            <div className="flex gap-2 flex-wrap mt-2">
              {topics.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setTopic(t.slug)}
                  className={`chip ${topic === t.slug ? "bg-purple text-white" : "bg-card text-ink"}`}
                >
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t-2 border-dashed border-ink/20 pt-4 space-y-3">
            <div className="relative">
              <Toolbar
                editor={editor}
                onLinkClick={openLinkPopover}
                onImageUploadClick={() => imgInputRef.current?.click()}
              />
              {popover && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute z-30 top-full mt-2 left-0 w-[320px] max-w-[90vw] border-2 border-ink rounded-xl bg-card shadow-pop p-3 space-y-2 text-[13px]"
                >
                  {popover.kind === "link" ? (
                    <>
                      <input
                        autoFocus
                        value={popover.url}
                        onChange={(e) =>
                          setPopover({ kind: "link", url: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && applyLink()}
                        placeholder="https://example.com"
                        className="w-full border-2 border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple"
                      />
                      <div className="flex gap-2 justify-end items-center">
                        {editor?.isActive("link") && (
                          <button
                            type="button"
                            onClick={removeLink}
                            className="font-mono text-[11px] font-bold text-pink hover:underline cursor-pointer"
                          >
                            Remove link
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={applyLink}
                          className="btn btn-sm btn-purple !py-1 !px-3 text-[12px]"
                        >
                          Apply
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        value={popover.src}
                        onChange={(e) =>
                          setPopover({
                            kind: "image",
                            src: e.target.value,
                            caption: popover.caption,
                            busy: false,
                          })
                        }
                        placeholder="Image URL — or pick a file above"
                        disabled={popover.busy}
                        className="w-full border-2 border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple disabled:opacity-50"
                      />
                      <input
                        value={popover.caption}
                        onChange={(e) =>
                          setPopover({
                            kind: "image",
                            src: popover.src,
                            caption: e.target.value,
                            busy: false,
                          })
                        }
                        onKeyDown={(e) => e.key === "Enter" && applyImage()}
                        placeholder={popover.busy ? "Uploading…" : "Caption (optional)"}
                        disabled={popover.busy || !popover.src.trim()}
                        className="w-full border-2 border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple disabled:opacity-50"
                      />
                      <div className="flex gap-2 justify-end items-center">
                        <button
                          type="button"
                          onClick={() => setPopover(null)}
                          className="font-mono text-[11px] font-bold text-subtle hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={applyImage}
                          disabled={popover.busy || !popover.src.trim()}
                          className="btn btn-sm btn-purple !py-1 !px-3 text-[12px] disabled:opacity-40"
                        >
                          {popover.busy ? "Uploading…" : "Insert image"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleInlineImageFile(f);
                e.target.value = ""; // allow re-selecting the same file
              }}
            />
            <div className="border-2 border-ink/10 rounded-2xl px-5 py-4 bg-white/40">
              <EditorContent editor={editor} />
            </div>
          </div>
          {/* extras */}
          <div className="border-t-2 border-dashed border-ink/20 pt-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="btn btn-sm cursor-pointer">
                {uploadingCover ? "Uploading…" : coverUrl ? "↻ Change cover" : "🖼 Add cover image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} className="hidden" />
              </label>
              {coverUrl && (
                <button type="button" onClick={() => setCoverUrl("")} className="btn btn-sm">
                  Remove
                </button>
              )}
            </div>
            <label className="block font-mono text-[11px] text-subtle font-bold">
              SCHEDULE PUBLISH (optional)
              <input
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full mt-1 border-2 border-ink rounded-xl px-3 py-2 text-[13px] outline-none bg-card text-ink font-normal"
              />
            </label>
            <details>
              <summary className="font-mono text-[11px] text-subtle font-bold cursor-pointer">
                SEO OPTIONS (optional)
              </summary>
              <div className="space-y-2 mt-2">
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={60}
                  placeholder="Custom SEO title"
                  className="w-full border-2 border-ink rounded-xl px-3 py-2 text-[13px] outline-none bg-card text-ink"
                />
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={160}
                  rows={2}
                  placeholder="Custom meta description"
                  className="w-full border-2 border-ink rounded-xl px-3 py-2 text-[13px] outline-none resize-none bg-card text-ink"
                />
              </div>
            </details>
          </div>
        </section>

        {/* live preview */}
        <section className="card p-8 lg:sticky lg:top-24 self-start">
          <div className="font-mono text-[11px] text-purple font-bold mb-4">// live preview</div>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="w-full h-40 object-cover rounded-2xl border-2 border-ink mb-4" />
          )}
          <span className="chip bg-sky text-[#1A1440] mb-4 inline-block">
            {activeTopic.emoji} {activeTopic.name}
          </span>
          <h2 className="text-[30px] font-bold leading-tight mb-3">
            {title || "Your title appears here"}
          </h2>
          <p className="text-[16px] text-muted mb-6">
            {dek || "Your summary shows up right here to hook the reader."}
          </p>
          <div className="border-t-2 border-ink pt-5 space-y-3 text-[16px] leading-relaxed text-body">
            {body ? (
              parseBlocks(body).map((b, i) => {
                switch (b.type) {
                  case "h2":
                    return <h3 key={i} className="text-[20px] font-bold pt-1">{b.text}</h3>;
                  case "quote":
                    return <blockquote key={i} className="border-l-4 border-purple pl-4 italic font-semibold">{b.text}</blockquote>;
                  case "ul":
                    return (
                      <ul key={i} className="list-disc pl-6 space-y-1">
                        {b.items.map((it, j) => <li key={j}>{it}</li>)}
                      </ul>
                    );
                  case "code":
                    return (
                      <pre key={i} className="bg-[#0f0b24] text-[#e8e4ff] rounded-xl p-4 font-mono text-[13px] overflow-x-auto">
                        <code>{b.code}</code>
                      </pre>
                    );
                  case "img":
                    return (
                      <figure key={i}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.src}
                          alt={b.alt}
                          loading="lazy"
                          decoding="async"
                          className="w-full rounded-xl border-2 border-ink"
                        />
                        {b.caption && (
                          <figcaption className="font-mono text-[11px] text-subtle mt-1 text-center">
                            {b.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  case "footnotes":
                    return null; // definitions render on the published page
                  default:
                    return b.text ? <p key={i}>{b.text}</p> : null;
                }
              })
            ) : (
              <span className="text-subtle">
                As you type, your post renders here in the GoHackerz reading style.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}