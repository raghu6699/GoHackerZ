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
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Quote,
  List,
  ListOrdered,
  SquareCode,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { topics } from "@/lib/data";
import type { Block, Topic } from "@/lib/data";
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
  status?: string;
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
      aria-label={title}
      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 ${
        active
          ? "bg-purple text-white border-purple shadow-sm scale-105"
          : "bg-card border-ink/15 text-ink hover:border-purple hover:bg-purple/10"
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
    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-scroll py-1 px-1 max-w-full">
      {/* Text formatting */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-[1px] h-5 bg-ink/15 mx-0.5 shrink-0" />

      {/* Block formatting */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton title="Heading (H2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <SquareCode className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-[1px] h-5 bg-ink/15 mx-0.5 shrink-0" />

      {/* Media & links */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton title="Insert Link" active={editor.isActive("link")} onClick={onLinkClick}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert Image" onClick={onImageUploadClick}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-[1px] h-5 bg-ink/15 mx-0.5 shrink-0" />

      {/* History */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {editor.isActive("codeBlock") && (
        <select
          value={currentLang}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
          }
          className="border-2 border-ink/15 rounded-lg px-2 py-1 text-[12px] bg-card outline-none shrink-0 ml-1 font-mono"
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

function toDatetimeLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WriteEditor({
  initial,
  availableTopics,
}: {
  initial?: EditorInitial;
  availableTopics?: Topic[];
}) {
  const router = useRouter();
  const editing = !!initial;
  const topicList = availableTopics && availableTopics.length ? availableTopics : topics;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [dek, setDek] = useState(initial?.dek ?? "");
  const [topic, setTopic] = useState(initial?.topicSlug ?? topicList[0].slug);
  const [body, setBody] = useState(
    initial?.content ? blocksToText(initial.content) : ""
  );
  const [coverUrl, setCoverUrl] = useState(initial?.coverImage ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [schedule, setSchedule] = useState(
    initial?.scheduledAt ? toDatetimeLocal(initial.scheduledAt) : ""
  );

  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  const activeTopic = topicList.find((t) => t.slug === topic) ?? topicList[0];

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
    setTopic(snap.topicSlug || topicList[0].slug);
    setBody(snap.body);
    setCoverUrl(snap.coverImage ?? "");
    setSeoTitle(snap.seoTitle ?? "");
    setSeoDescription(snap.seoDescription ?? "");
    setSchedule(snap.scheduledAt ? toDatetimeLocal(snap.scheduledAt) : "");
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
        // update, then run it through the pipeline if not already published
        const patchRes = await fetch(`/api/articles/${initial.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload(false), readingTime }),
        });
        if (!patchRes.ok) {
          const patchData = await patchRes.json();
          throw new Error(patchData.error || "Failed to update article");
        }

        if (initial.status === "PUBLISHED") {
          clearSnapshot(draftKey);
          router.push(`/article/${initial.slug}`);
          router.refresh();
          return;
        }

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

  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  return (
    <div className="wrap max-w-full px-3 sm:px-6 py-4 sm:py-8">
      {/* ── Editor Header Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <span className="chip bg-lime mb-1 text-[11px]">
            {editing ? (initial?.status === "PUBLISHED" ? "✎ editing published post" : "✎ editing draft") : "✎ Draft"}
          </span>
          <h1 className="text-[24px] sm:text-[32px] font-bold leading-tight">
            {editing ? (initial?.status === "PUBLISHED" ? "Edit published post" : "Edit your draft") : "Write a post"}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] sm:text-[12px] text-subtle shrink-0">
            {words} words · {readingTime} min
          </span>
          <button type="button" onClick={saveDraft} disabled={!title.trim() || busy !== ""} className="btn btn-sm disabled:opacity-40 flex-1 sm:flex-initial">
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" onClick={publishOrSubmit} disabled={!title.trim() || busy !== ""} className="btn btn-purple btn-sm sm:btn-md disabled:opacity-40 flex-1 sm:flex-initial">
            {busy === "publish" ? "Saving…" : initial?.status === "PUBLISHED" ? "Save Changes ✦" : editing ? "Submit →" : "Publish ✦"}
          </button>
        </div>
      </div>

      {/* ── Mobile Mode Switcher (Write vs Live Preview) ── */}
      <div className="lg:hidden flex bg-card border border-ink/15 rounded-xl p-1 mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("write")}
          className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
            mobileTab === "write" ? "bg-purple text-white shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Write ✎
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
            mobileTab === "preview" ? "bg-purple text-white shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Preview 👁
        </button>
      </div>

      {recovered && (
        <div className="font-mono text-[12px] bg-sky border-2 border-ink rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2 justify-between flex-wrap">
          <span>💾 Unsaved draft found.</span>
          <span className="flex gap-2">
            <button type="button" className="btn btn-sm py-1 px-2 text-[11px]" onClick={() => restoreDraft(recovered)}>
              Restore
            </button>
            <button type="button" className="btn btn-sm py-1 px-2 text-[11px]" onClick={discardRecovered}>
              Discard
            </button>
          </span>
        </div>
      )}

      {error && (
        <p className="font-mono text-[12px] font-bold bg-peach border-2 border-ink rounded-xl px-4 py-2.5 text-[#8a2b00] mb-4">
          ⚠ {error}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start max-w-full">
        {/* Editor Pane */}
        <section className={`card p-4 sm:p-6 space-y-4 max-w-full ${mobileTab === "preview" ? "hidden lg:block" : "block"}`}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article Title..."
            className="w-full text-[20px] sm:text-[26px] font-bold outline-none placeholder:text-[#c3bfe0] bg-transparent"
          />
          <textarea
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            placeholder="Short summary that hooks the reader."
            rows={2}
            className="w-full text-[14px] sm:text-[15px] outline-none resize-none placeholder:text-[#c3bfe0] bg-transparent"
          />
          <div>
            <span className="font-mono text-[11px] text-subtle font-bold">TOPIC</span>
            <div className="flex gap-1.5 flex-wrap mt-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
              {topicList.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setTopic(t.slug)}
                  className={`chip text-[12px] ${topic === t.slug ? "bg-purple text-white" : "bg-card text-ink"}`}
                >
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-dashed border-ink/20 pt-3 max-w-full">
            <div className="border-2 border-ink/15 rounded-2xl bg-card shadow-sm">
              <div className="bg-card border-b border-ink/15 p-1.5 sm:p-2 rounded-t-2xl relative">
                <Toolbar
                  editor={editor}
                  onLinkClick={openLinkPopover}
                  onImageUploadClick={() => imgInputRef.current?.click()}
                />
                {popover && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute z-30 top-full mt-2 left-2 w-[300px] max-w-[88vw] border-2 border-ink rounded-xl bg-card shadow-pop p-3 space-y-2 text-[13px]"
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
                          className="w-full border border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple"
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
                          placeholder="Image URL"
                          disabled={popover.busy}
                          className="w-full border border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple disabled:opacity-50"
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
                          className="w-full border border-ink/15 rounded-lg px-3 py-1.5 outline-none bg-card text-ink focus:border-purple disabled:opacity-50"
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
                  e.target.value = "";
                }}
              />
              <div className="p-3 sm:p-5 bg-bg/30 rounded-b-2xl">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
          {/* Extras */}
          <div className="border-t border-dashed border-ink/20 pt-3 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
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
                className="w-full mt-1 border border-ink/20 rounded-xl px-3 py-2 text-[13px] outline-none bg-card text-ink font-normal"
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
                  className="w-full border border-ink/20 rounded-xl px-3 py-2 text-[13px] outline-none bg-card text-ink"
                />
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={160}
                  rows={2}
                  placeholder="Custom meta description"
                  className="w-full border border-ink/20 rounded-xl px-3 py-2 text-[13px] outline-none resize-none bg-card text-ink"
                />
              </div>
            </details>
          </div>
        </section>

        {/* Live Preview Pane */}
        <section className={`card p-4 sm:p-6 lg:sticky lg:top-24 self-start max-w-full overflow-hidden ${mobileTab === "write" ? "hidden lg:block" : "block"}`}>
          <div className="font-mono text-[11px] text-purple font-bold mb-3">// live preview</div>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="w-full h-36 sm:h-40 object-cover rounded-xl border border-ink/20 mb-3" />
          )}
          <span className="chip bg-sky text-[#1A1440] mb-3 inline-block">
            {activeTopic.emoji} {activeTopic.name}
          </span>
          <h2 className="text-[22px] sm:text-[28px] font-bold leading-snug mb-2 break-words">
            {title || "Your title appears here"}
          </h2>
          <p className="text-[14px] sm:text-[15px] text-muted mb-4 break-words">
            {dek || "Your summary shows up right here."}
          </p>
          <div className="border-t border-ink/20 pt-4 space-y-3 text-[15px] sm:text-[16px] leading-relaxed text-body break-words overflow-hidden">
            {body ? (
              parseBlocks(body).map((b, i) => {
                switch (b.type) {
                  case "h2":
                    return <h3 key={i} className="text-[18px] sm:text-[20px] font-bold pt-1 break-words">{b.text}</h3>;
                  case "quote":
                    return <blockquote key={i} className="border-l-4 border-purple pl-3 italic font-semibold">{b.text}</blockquote>;
                  case "ul":
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1">
                        {b.items.map((it, j) => <li key={j} className="break-words">{it}</li>)}
                      </ul>
                    );
                  case "code":
                    return (
                      <pre key={i} className="bg-[#0f0b24] text-[#e8e4ff] rounded-xl p-3 font-mono text-[12.5px] overflow-x-auto touch-scroll">
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
                          className="w-full rounded-xl border border-ink/20"
                        />
                        {b.caption && (
                          <figcaption className="font-mono text-[11px] text-subtle mt-1 text-center">
                            {b.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  default:
                    return "text" in b && b.text ? <p key={i} className="break-words">{b.text}</p> : null;
                }
              })
            ) : (
              <span className="text-subtle">
                As you type, your post renders here in the reading style.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}