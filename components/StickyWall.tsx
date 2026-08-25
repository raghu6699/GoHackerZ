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
const COLORS = 5; // .gw-nc0 … .gw-nc4 in globals.css
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

export function StickyWall() {
  const [open, setOpen] = useState(false);
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

  // ── Open / close ────────────────────────────────────────────────────────
  const show = useCallback(() => {
    setOpen(true);
    setLoadError(false);
    fetch(API, { headers: { Accept: "application/json" } })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
      )
      .then((d) => setNotes(Array.isArray(d.notes) ? d.notes : []))
      .catch(() => setLoadError(true)); // a failed load still allows sticking
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    setDraft(null); // unstuck notes never persist
    setPostError("");
    setPosting(false);
    setScrub(SCRUB_MAX); // next open starts at now
  }, []);

  // Lock page scroll behind the overlay.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes — any draft out there is simply discarded.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

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
      x: prev?.x ?? null,
      y: prev?.y ?? null,
    }));
  };

  const discardDraft = () => setDraft(null);

  // ── Dragging: from a chip (new draft) or the draft's own edges (move) ──
  const onChipPointerDown = (e: React.PointerEvent, color: number) => {
    if (posting || e.button !== 0) return;
    e.preventDefault();
    // Tapping a chip while a draft is out recolours rather than replaces:
    // remember where the old draft sat so a plain tap keeps it there.
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
    if (!draft || posting) return;
    const target = e.target as HTMLElement;
    if (!draftRef.current?.contains(target)) return;
    if (target.closest("textarea, input, button")) return;
    e.preventDefault();
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      fromChip: false,
      prev: null,
    };
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
          discardDraft(); // touch taken away before anything happened
        } else {
          // A tap is not a placement. Recolouring still works: a tap leaves
          // the draft where it already was; with no prior draft it discards.
          setDraft((d) => {
            if (!d) return d;
            if (!drag.prev || drag.prev.x == null || drag.prev.y == null)
              return null;
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
    // The browser can take a touch away mid-drag (system gesture, incoming
    // call). Without this the draft stays glued to a finger that is gone.
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
    if (!draft || posting) return;
    const msg = draft.msg.trim();
    if (!msg) return;
    setPosting(true);
    setPostError("");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg,
          name: draft.name.trim(),
          web: webRef.current?.value ?? "", // honeypot — should stay empty
          color: draft.color,
          x: draft.x ?? 0.5,
          y: draft.y ?? 0.5,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        note?: Note;
        error?: string;
      };
      if (!r.ok) throw new Error(d.error || "something went wrong - try again");
      try {
        localStorage.setItem("wall-name", draft.name.trim());
      } catch {}
      if (d.note) {
        setNotes((ns) => [...ns, d.note as Note]);
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <button type="button" className="gw-launcher" onClick={show}>
        <span aria-hidden>📌</span> Leave a note
      </button>

      {open && (
        <section
          className="gw-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Guestbook — notes on the wall"
        >
          <div
            className="gw-canvas"
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
          >
            {visible.map((n) => (
              <div
                key={n.id}
                className={`gw-note gw-nc${n.color}`}
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
                className={`gw-note gw-draft gw-nc${draft.color}`}
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
                className={`gw-chip gw-nc${i}`}
                aria-label={`New note (color ${i + 1})`}
                onPointerDown={(e) => onChipPointerDown(e, i)}
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
              grab a color → drag it onto the wall → write → stick it up
            </p>
          )}
        </section>
      )}
    </>
  );
}