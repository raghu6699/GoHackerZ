"use client";

// ──────────────────────────────────────────────────────────────────────────
//  STICKY-NOTE WALL (guestbook)
//
//  A React port of the sticky-note guestbook: a full-screen corkboard where
//  visitors drag a colored chip from the left edge onto the wall — it expands
//  into a writable note with a Stick button. Nothing persists until Stick
//  posts it; abandoned drafts vanish on Escape / close / starting a new drag
//  (the text carries over to the new color, the draft itself is never saved).
//
//  The slider at the bottom travels back through the wall's history. It is
//  indexed by note, not by elapsed time — posting activity is lumpy (one day
//  can carry hundreds of notes, a week can carry three), so a time axis would
//  spend all its travel on empty stretches. A step of the slider is roughly a
//  note either way.
//
//  All note text renders through React text nodes (escaped by default) so
//  notes can't inject markup. Spam defense: honeypot field + middleware
//  rate limit; admins hide notes via the `hidden` flag on WallNote.
// ──────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

const API = "/api/guestbook";
// NOTE: these class names MUST appear as complete literals in this file.
// Tailwind purges handwritten `@layer` rules from globals.css unless the
// full class name shows up in scanned content — the old dynamic
// `gw-nc${i}` template silently dropped every color but the two that
// happened to be mentioned in a comment.
const NOTE_COLORS = [
  "gw-nc0", // yellow
  "gw-nc1", // pink
  "gw-nc2", // sky
  "gw-nc3", // purple
  "gw-nc4", // lime
  "gw-nc5", // orange
  "gw-nc6", // teal/mint
  "gw-nc7", // coral
  "gw-nc8", // periwinkle
  "gw-nc9", // orchid
] as const;
const COLORS = NOTE_COLORS.length;
const MSG_MAX = 280;
const NAME_MAX = 40;
const SHOW_MAX = 500; // newest notes drawn on the wall
const SCRUB_MAX = 1000;

type Note = {
  id: string;
  name: string;
  msg: string;
  ts: number;
  color: number;
  x: number;
  y: number;
};

type Draft = {
  color: number;
  msg: string;
  name: string;
  x: number | null; // null = not placed yet (follows the pointer while dragging)
  y: number | null;
};

// Deterministic hand-stuck tilt per note (±3deg), stable across re-renders.
const hashOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const rotOf = (id: string) => ((hashOf(id + "r") % 100) / 100 - 0.5) * 6;

// Name the visitor used last time, so repeat note-leavers don't retype it.
const rememberedName = () => {
  try {
    return localStorage.getItem("wall-name") ?? "";
  } catch {
    return "";
  }
};

const fmtDate = (ts: number) => {
  const d = new Date(ts * 1000);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
};

// Keep a center-positioned note fully on screen. Returns clamped x/y in 0..1.
function clampPos(
  canvas: HTMLElement,
  el: HTMLElement,
  cx: number,
  cy: number
): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  const mx = (el.offsetWidth / 2 + 8) / r.width;
  const my = (el.offsetHeight / 2 + 8) / r.height;
  return {
    x: Math.max(mx, Math.min(1 - mx, (cx - r.left) / r.width)),
    y: Math.max(my, Math.min(1 - my, (cy - r.top) / r.height)),
  };
}

export function StickyWall({
  mode = "embedded",
  variant = "both",
}: {
  mode?: "embedded" | "modal";
  variant?: "launcher" | "inline" | "both";
}) {
  const [open, setOpen] = useState(mode === "embedded");
  const [notes, setNotes] = useState<Note[]>([]); // oldest first
  const [loadError, setLoadError] = useState(false);
  const [scrub, setScrub] = useState(SCRUB_MAX); // 1000 = now
  const [draft, setDraft] = useState<Draft | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const draftRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const webRef = useRef<HTMLInputElement | null>(null); // honeypot
  // Pointer-drag bookkeeping lives in refs — mutating state on every
  // pointermove would re-render the whole wall mid-drag.
  const dragRef = useRef<{
    sx: number;
    sy: number;
    moved: boolean;
    fromChip: boolean;
    prev: { x: number | null; y: number | null } | null; // draft pos before a recolour tap
  } | null>(null);

  // ── Open / close / fetch ──────────────────────────────────────────────────
  const fetchNotes = useCallback(() => {
    setLoadError(false);
    fetch(API, { headers: { Accept: "application/json" } })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
      )
      .then((d) => setNotes(Array.isArray(d.notes) ? d.notes : []))
      .catch(() => setLoadError(true));
  }, []);

  const show = useCallback(() => {
    setOpen(true);
    fetchNotes();
  }, [fetchNotes]);

  const hide = useCallback(() => {
    if (mode === "modal") {
      setOpen(false);
    }
    setDraft(null); // unstuck notes never persist
    setPostError("");
    setPosting(false);
    setScrub(SCRUB_MAX); // next open starts at now
  }, [mode]);

  useEffect(() => {
    if (mode === "embedded") {
      fetchNotes();
    }
  }, [mode, fetchNotes]);

  // Lock page scroll behind the overlay only when in modal mode.
  useEffect(() => {
    if (!open || mode === "embedded") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mode]);

  // Escape closes in modal mode — any draft out there is simply discarded.
  useEffect(() => {
    if (!open || mode === "embedded") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mode, hide]);

  // ── Time travel ─────────────────────────────────────────────────────────
  const total = notes.length;
  const hi = total === 0 ? -1 : Math.round((scrub / SCRUB_MAX) * (total - 1));
  const lo = Math.max(0, hi + 1 - SHOW_MAX);
  const visible = hi < lo ? [] : notes.slice(lo, hi + 1);

  // ── Draft lifecycle ─────────────────────────────────────────────────────
  const startDraft = (color: number) => {
    setPostError("");
    setDraft((prev) => ({
      color,
      msg: prev?.msg ?? "",
      name: prev?.name ?? rememberedName(),
      x: prev?.x ?? 0.5,
      y: prev?.y ?? 0.45,
    }));
  };

  const discardDraft = () => setDraft(null);

  // ── Dragging: from a chip (new draft) or the draft's own edges (move) ──
  const onChipPointerDown = (e: React.PointerEvent, color: number) => {
    if (posting || e.button !== 0) return;
    e.preventDefault();
    const prev = draft ? { x: draft.x, y: draft.y } : null;
    startDraft(color);
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      fromChip: true,
      prev,
    };
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (!draft || posting || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("textarea, input, button")) return;
    const canvas = canvasRef.current;
    const el = draftRef.current;
    if (!canvas || !el) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    const clamped = clampPos(canvas, el, cx, cy);
    setDraft((d) => (d ? { ...d, x: clamped.x, y: clamped.y } : d));
  };

  useEffect(() => {
    if (!open) return;

    const placeAt = (clientX: number, clientY: number) => {
      if (!draftRef.current || !canvasRef.current) return null;
      const p = clampPos(canvasRef.current, draftRef.current, clientX, clientY);
      draftRef.current.style.left = `${p.x * 100}%`;
      draftRef.current.style.top = `${p.y * 100}%`;
      return p;
    };

    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4)
        drag.moved = true;
      placeAt(e.clientX, e.clientY);
    };

    const finishDrag = (e: PointerEvent | null, cancelled: boolean) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      if (drag.fromChip && !drag.moved) {
        if (cancelled) {
          discardDraft();
        } else {
          setDraft((d) => {
            if (!d) return d;
            if (!drag.prev || drag.prev.x == null || drag.prev.y == null)
              return { ...d, x: 0.5, y: 0.45 };
            return { ...d, x: drag.prev.x, y: drag.prev.y };
          });
        }
        return;
      }
      if (e) {
        const p = placeAt(e.clientX, e.clientY); // re-clamp at full size
        if (p)
          setDraft((d) =>
            d && !posting ? { ...d, x: p.x, y: p.y } : d
          );
      }
    };

    const onUp = (e: PointerEvent) => finishDrag(e, false);
    const onCancel = () => finishDrag(null, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [open, posting]);

  // ── Stick ───────────────────────────────────────────────────────────────
  const stick = async () => {
    if (!draft || !draft.msg.trim() || posting) return;
    if (webRef.current && webRef.current.value !== "") return;

    setPosting(true);
    setPostError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg: draft.msg.trim(),
          name: draft.name.trim() || undefined,
          web: webRef.current?.value ?? "",
          color: draft.color,
          x: draft.x ?? 0.5,
          y: draft.y ?? 0.45,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "something went wrong - try again");
      try {
        localStorage.setItem("wall-name", draft.name.trim());
      } catch {}
      if (data.note) {
        setNotes((ns) => [...ns, data.note as Note]);
        setScrub(SCRUB_MAX); // sticking returns you to now
      }
      setDraft(null);
    } catch (err) {
      setPostError(
        err instanceof Error && err.message ? err.message : "try again"
      );
    } finally {
      setPosting(false);
    }
  };

  // ── Render Embedded Mode ─────────────────────────────────────────────────
  if (mode === "embedded") {
    return (
      <div className="w-full space-y-6">
        {/* Desktop interactive 2D corkboard */}
        <div className="hidden md:block relative w-full h-[620px] rounded-3xl border-2 border-ink shadow-pop-lg overflow-hidden bg-[#e8e4f7] dark:bg-[#14102b] dotgrid">
          {/* Corkboard canvas */}
          <div
            className="gw-canvas"
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
          >
            {visible.map((n) => (
              <div
                key={n.id}
                className={`gw-note ${NOTE_COLORS[n.color] ?? "gw-nc0"}`}
                style={
                  {
                    left: `${n.x * 100}%`,
                    top: `${n.y * 100}%`,
                    "--rot": `${rotOf(n.id).toFixed(1)}deg`,
                  } as React.CSSProperties
                }
              >
                <p className="gw-note-txt">{n.msg}</p>
                <p className="gw-note-foot">
                  {(n.name ? `${n.name} · ` : "") + fmtDate(n.ts)}
                </p>
              </div>
            ))}

            {total === 0 && !loadError && (
              <div className="gw-empty">
                <span aria-hidden>🗒️</span> The wall is empty — be the first to stick something up.
              </div>
            )}
            {loadError && (
              <div className="gw-empty">
                Couldn&apos;t load the wall right now — you can still leave a note.
              </div>
            )}

            {draft && (
              <div
                ref={draftRef}
                data-testid="gw-draft"
                className={`gw-note gw-draft ${NOTE_COLORS[draft.color] ?? "gw-nc0"}`}
                style={
                  {
                    ...(draft.x != null &&
                      draft.y != null && {
                        left: `${draft.x * 100}%`,
                        top: `${draft.y * 100}%`,
                      }),
                  } as React.CSSProperties
                }
              >
                <textarea
                  className="gw-write"
                  maxLength={MSG_MAX}
                  aria-label="Your note"
                  placeholder="type your note…"
                  autoFocus
                  value={draft.msg}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, msg: e.target.value.slice(0, MSG_MAX) } : d
                    )
                  }
                />
                <input
                  ref={webRef}
                  type="text"
                  name="web"
                  className="gw-hp"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="gw-name"
                  maxLength={NAME_MAX}
                  placeholder="your name"
                  aria-label="Your name (optional)"
                  value={draft.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => (d ? { ...d, name: v } : d));
                  }}
                />
                <div className="gw-draft-foot">
                  <span className="gw-note-err" role="status">
                    {postError}
                  </span>
                  <button
                    type="button"
                    className="gw-stick"
                    disabled={posting || !draft.msg.trim()}
                    onClick={stick}
                  >
                    {posting ? "…" : "Stick"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Palette selector top-left */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-md p-2 rounded-2xl border-2 border-ink shadow-pop-sm">
            <span className="font-mono text-[11px] font-bold text-subtle px-1">CHOOSE COLOR:</span>
            {Array.from({ length: COLORS }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${NOTE_COLORS[i]} ${
                  draft?.color === i ? "border-ink scale-110 shadow-sm" : "border-ink/20 opacity-80 hover:opacity-100"
                }`}
                aria-label={`New note (color ${i + 1})`}
                onPointerDown={(e) => onChipPointerDown(e, i)}
                onClick={() => startDraft(i)}
              />
            ))}
          </div>

          {/* Scrub / Hint at bottom */}
          {!draft && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 font-mono text-[12px] font-bold text-muted bg-card/95 backdrop-blur-md border-2 border-ink rounded-full px-4 py-1.5 shadow-pop-sm pointer-events-none">
              💡 Drag or tap a color swatch to write & stick your note
            </div>
          )}
        </div>

        {/* Mobile View (< md) */}
        <div className="block md:hidden space-y-4">
          <div className="card p-4 shadow-sm">
            {!draft ? (
              <button
                type="button"
                onClick={() => startDraft(0)}
                className="w-full btn btn-purple py-3 text-[15px] font-bold shadow-pop flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✍️</span> Leave a Note on the Wall
              </button>
            ) : (
              <div className={`gw-note gw-draft w-full !max-w-full !relative !transform-none !left-auto !top-auto ${NOTE_COLORS[draft.color] ?? "gw-nc0"} p-4 rounded-2xl shadow-pop`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#1A1440]/60">// Select Color</span>
                  <button type="button" onClick={discardDraft} className="text-[12px] font-bold text-[#1A1440]/60 hover:underline">Cancel</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                  {Array.from({ length: COLORS }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => startDraft(i)}
                      className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${NOTE_COLORS[i]} ${draft.color === i ? "border-ink scale-110 shadow-sm" : "border-transparent opacity-75"}`}
                    />
                  ))}
                </div>
                <textarea
                  className="gw-write w-full h-[110px] resize-none bg-transparent border-0 outline-none text-[19px] leading-[1.25] font-semibold text-[#1A1440] placeholder:text-[#1A1440]/40"
                  maxLength={MSG_MAX}
                  placeholder="Type your note…"
                  autoFocus
                  value={draft.msg}
                  onChange={(e) => setDraft((d) => (d ? { ...d, msg: e.target.value.slice(0, MSG_MAX) } : d))}
                />
                <input ref={webRef} type="text" name="web" className="gw-hp" tabIndex={-1} autoComplete="off" />
                <input
                  type="text"
                  className="gw-name w-full rounded-sm px-2 py-1 mb-3 text-[16px] font-semibold text-[#1A1440] outline-none border-b-2 border-ink/30 bg-transparent"
                  maxLength={NAME_MAX}
                  placeholder="Your name (optional)"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-pink">{postError}</span>
                  <button
                    type="button"
                    className="btn btn-purple btn-sm px-5 py-2 font-bold disabled:opacity-50"
                    disabled={posting || !draft.msg.trim()}
                    onClick={stick}
                  >
                    {posting ? "Sticking…" : "Stick Note 📌"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {notes.slice().reverse().map((n) => (
              <div
                key={n.id}
                className={`gw-note !relative !transform-none !left-auto !top-auto w-full !max-w-full p-4 rounded-xl shadow-sm ${NOTE_COLORS[n.color] ?? "gw-nc0"}`}
              >
                <p className="gw-note-txt">{n.msg}</p>
                <p className="gw-note-foot">
                  {(n.name ? `${n.name} · ` : "") + fmtDate(n.ts)}
                </p>
              </div>
            ))}
            {total === 0 && !loadError && (
              <div className="text-center py-8 text-muted font-mono text-[13px]">
                🗒️ The wall is empty — be the first to stick something up!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render Modal Mode ─────────────────────────────────────────────────────
  return (
    <>
      {(variant === "inline" || variant === "both") && (
        <button
          type="button"
          onClick={show}
          className="btn btn-purple py-3 px-6 text-[15px] sm:text-[16px] font-bold shadow-pop hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>📌</span> Open Guestbook Wall & Leave a Note
        </button>
      )}

      {(variant === "launcher" || variant === "both") && (
        <button type="button" className="gw-launcher inline-flex" onClick={show}>
          <span aria-hidden>📌</span> Leave a note
        </button>
      )}

      {open && (
        <section
          className="gw-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Guestbook — notes on the wall"
        >
          {/* ── Mobile View (< md): Clean, touch-native scrollable feed & composer ── */}
          <div className="block md:hidden h-full overflow-y-auto p-4 max-w-lg mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#e8e4f7]/90 dark:bg-[#14102b]/90 backdrop-blur-md py-2.5 px-2 z-30 rounded-xl border border-ink/15 shadow-sm">
              <div>
                <h2 className="text-[19px] font-bold flex items-center gap-2 text-ink">
                  <span>📌</span> Guestbook Wall
                </h2>
                <p className="font-mono text-[11px] text-muted">{notes.length} notes posted</p>
              </div>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center text-[18px] font-bold text-ink bg-card border-2 border-ink rounded-full shadow-pop cursor-pointer active:scale-95"
                onClick={hide}
              >
                ✕
              </button>
            </div>

            {/* Mobile Composer */}
            <div className="mb-6">
              {!draft ? (
                <button
                  type="button"
                  onClick={() => startDraft(0)}
                  className="w-full btn btn-purple py-3 text-[15px] font-bold shadow-pop flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✍️</span> Leave a Note on the Wall
                </button>
              ) : (
                <div className={`gw-note gw-draft w-full !max-w-full !relative !transform-none !left-auto !top-auto ${NOTE_COLORS[draft.color] ?? "gw-nc0"} p-4 rounded-2xl shadow-pop`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold uppercase text-[#1A1440]/60">// Select Color</span>
                    <button type="button" onClick={discardDraft} className="text-[12px] font-bold text-[#1A1440]/60 hover:underline">Cancel</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                    {Array.from({ length: COLORS }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => startDraft(i)}
                        className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${NOTE_COLORS[i]} ${draft.color === i ? "border-ink scale-110 shadow-sm" : "border-transparent opacity-75"}`}
                      />
                    ))}
                  </div>
                  <textarea
                    className="gw-write w-full h-[110px] resize-none bg-transparent border-0 outline-none text-[19px] leading-[1.25] font-semibold text-[#1A1440] placeholder:text-[#1A1440]/40"
                    maxLength={MSG_MAX}
                    placeholder="Type your note…"
                    autoFocus
                    value={draft.msg}
                    onChange={(e) => setDraft((d) => (d ? { ...d, msg: e.target.value.slice(0, MSG_MAX) } : d))}
                  />
                  <input ref={webRef} type="text" name="web" className="gw-hp" tabIndex={-1} autoComplete="off" />
                  <input
                    type="text"
                    className="gw-name w-full rounded-sm px-2 py-1 mb-3 text-[16px] font-semibold text-[#1A1440] outline-none border-b-2 border-ink/30 bg-transparent"
                    maxLength={NAME_MAX}
                    placeholder="Your name (optional)"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-pink">{postError}</span>
                    <button
                      type="button"
                      className="btn btn-purple btn-sm px-5 py-2 font-bold disabled:opacity-50"
                      disabled={posting || !draft.msg.trim()}
                      onClick={stick}
                    >
                      {posting ? "Sticking…" : "Stick Note 📌"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Notes Card List */}
            <div className="space-y-4">
              {notes.slice().reverse().map((n) => (
                <div
                  key={n.id}
                  className={`gw-note !relative !transform-none !left-auto !top-auto w-full !max-w-full p-4 rounded-xl shadow-sm ${NOTE_COLORS[n.color] ?? "gw-nc0"}`}
                >
                  <p className="gw-note-txt">{n.msg}</p>
                  <p className="gw-note-foot">
                    {(n.name ? `${n.name} · ` : "") + fmtDate(n.ts)}
                  </p>
                </div>
              ))}
              {total === 0 && !loadError && (
                <div className="text-center py-8 text-muted font-mono text-[13px]">
                  🗒️ The wall is empty — be the first to stick something up!
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop View (md+): Full interactive 2D corkboard canvas ── */}
          <div className="hidden md:block absolute inset-0">
            <div
              className="gw-canvas"
              ref={canvasRef}
              onPointerDown={onCanvasPointerDown}
            >
              {visible.map((n) => (
                <div
                  key={n.id}
                  className={`gw-note ${NOTE_COLORS[n.color] ?? "gw-nc0"}`}
                  style={
                    {
                      left: `${n.x * 100}%`,
                      top: `${n.y * 100}%`,
                      "--rot": `${rotOf(n.id).toFixed(1)}deg`,
                    } as React.CSSProperties
                  }
                >
                  <p className="gw-note-txt">{n.msg}</p>
                  <p className="gw-note-foot">
                    {(n.name ? `${n.name} · ` : "") + fmtDate(n.ts)}
                  </p>
                </div>
              ))}

              {total === 0 && !loadError && (
                <div className="gw-empty">
                  <span aria-hidden>🗒️</span> The wall is empty — be the first to
                  stick something up.
                </div>
              )}
              {loadError && (
                <div className="gw-empty">
                  Couldn&apos;t load the wall right now — you can still leave a
                  note.
                </div>
              )}

              {draft && (
                <div
                  ref={draftRef}
                  data-testid="gw-draft"
                  className={`gw-note gw-draft ${NOTE_COLORS[draft.color] ?? "gw-nc0"}`}
                  style={
                    {
                      ...(draft.x != null &&
                        draft.y != null && {
                          left: `${draft.x * 100}%`,
                          top: `${draft.y * 100}%`,
                        }),
                    } as React.CSSProperties
                  }
                >
                  <textarea
                    className="gw-write"
                    maxLength={MSG_MAX}
                    aria-label="Your note"
                    placeholder="type your note…"
                    autoFocus
                    value={draft.msg}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, msg: e.target.value.slice(0, MSG_MAX) } : d
                      )
                    }
                  />
                  {/* Honeypot: hidden from humans, irresistible to bots */}
                  <input
                    ref={webRef}
                    type="text"
                    name="web"
                    className="gw-hp"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    className="gw-name"
                    maxLength={NAME_MAX}
                    placeholder="your name"
                    aria-label="Your name (optional)"
                    value={draft.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft((d) => (d ? { ...d, name: v } : d));
                    }}
                  />
                  <div className="gw-draft-foot">
                    <span className="gw-note-err" role="status">
                      {postError}
                    </span>
                    <button
                      type="button"
                      className="gw-stick"
                      disabled={posting || !draft.msg.trim()}
                      onClick={stick}
                    >
                      {posting ? "…" : "Stick"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="gw-close"
              aria-label="Close"
              onClick={hide}
            >
              ✕
            </button>

            <div className="gw-palette">
              {Array.from({ length: COLORS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`gw-chip ${NOTE_COLORS[i]}`}
                  aria-label={`New note (color ${i + 1})`}
                  onPointerDown={(e) => onChipPointerDown(e, i)}
                  onClick={() => {
                    setDraft((d) => {
                      if (d) return { ...d, color: i, x: d.x ?? 0.5, y: d.y ?? 0.45 };
                      return {
                        color: i,
                        msg: "",
                        name: rememberedName(),
                        x: 0.5,
                        y: 0.45,
                      };
                    });
                  }}
                />
              ))}
            </div>

            {total >= 2 && (
              <>
                <input
                  className="gw-scrub"
                  type="range"
                  min={0}
                  max={SCRUB_MAX}
                  value={scrub}
                  step={1}
                  aria-label="Travel back through the wall's history"
                  aria-valuetext={
                    scrub >= SCRUB_MAX
                      ? "now"
                      : `notes ${lo + 1} to ${hi + 1} of ${total}`
                  }
                  onChange={(e) => {
                    if (!draft) setScrub(Number(e.target.value));
                  }}
                />
                {/* Where am I on the timeline — only shown while traveling */}
                {scrub < SCRUB_MAX && hi >= 0 && (
                  <p className="gw-scrub-label" aria-hidden="true">
                    notes {lo + 1}–{hi + 1} of {total} · wall as of{" "}
                    {fmtDate(notes[hi].ts)}
                  </p>
                )}
              </>
            )}

            {!draft && scrub >= SCRUB_MAX && (
              <p className="gw-hint">
                tap or drag a color → write your note → stick it up
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}