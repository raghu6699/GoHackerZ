import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Guestbook wall ──────────────────────────────────────────────────────────
// Tiny JSON service backing the sticky-note wall (components/StickyWall.tsx).
//
//   GET  /api/guestbook → { notes: [...] }   newest 500, oldest first
//   POST /api/guestbook → 201 { note }        sticks a new note
//
// Mutating traffic is already rate-limited per IP by middleware.ts, and the
// posting UI carries a honeypot field (`web`) — bots that fill it get a fake
// 201 and their note is silently dropped, never touching the database.

const MSG_MAX = 280;
const NAME_MAX = 40;
const COLORS = 10;
const FETCH_MAX = 500; // newest notes returned — matches the wall's window

type NoteDTO = {
  id: string;
  name: string;
  msg: string;
  ts: number; // epoch seconds — the wire format the wall expects
  color: number;
  x: number; // relative 0..1, rounded to 4dp (~enough sub-pixel precision)
  y: number;
};

const clamp01 = (v: unknown) =>
  Math.min(1, Math.max(0, typeof v === "number" && Number.isFinite(v) ? v : 0.5));

function toDTO(n: {
  id: string;
  name: string;
  msg: string;
  color: number;
  x: number;
  y: number;
  createdAt: Date;
}): NoteDTO {
  return {
    id: n.id,
    name: n.name,
    msg: n.msg,
    ts: Math.floor(n.createdAt.getTime() / 1000),
    color: n.color,
    x: Math.round(n.x * 10000) / 10000,
    y: Math.round(n.y * 10000) / 10000,
  };
}

export async function GET() {
  try {
    // Newest FETCH_MAX, delivered oldest-first so the wall can treat the
    // array as a timeline and slice whatever window it wants.
    const rows = await prisma.wallNote.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: FETCH_MAX,
    });
    return NextResponse.json({ notes: rows.reverse().map(toDTO) });
  } catch {
    return NextResponse.json(
      { error: "couldn't load the wall - try again" },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  let body: {
    msg?: string;
    name?: string;
    web?: string; // honeypot — humans never fill this
    color?: number;
    x?: number;
    y?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawMsg = typeof body.msg === "string" ? body.msg.trim() : "";
  const rawName = typeof body.name === "string" ? body.name.trim() : "";

  if (!rawMsg) {
    return NextResponse.json({ error: "write something first!" }, { status: 400 });
  }
  if (rawMsg.length > MSG_MAX) {
    return NextResponse.json({ error: "note must be 280 characters or less." }, { status: 400 });
  }
  if (rawName.length > NAME_MAX) {
    return NextResponse.json({ error: "name must be 40 characters or less." }, { status: 400 });
  }

  // Honeypot tripped: reject bot traffic
  if (typeof body.web === "string" && body.web.length > 0) {
    return NextResponse.json({ error: "Spam detected." }, { status: 400 });
  }

  const msg = rawMsg;
  const name = rawName;

  const color =
    Number.isInteger(body.color) && body.color! >= 0 && body.color! < COLORS
      ? body.color!
      : 0;

  try {
    const created = await prisma.wallNote.create({
      data: { msg, name, color, x: clamp01(body.x), y: clamp01(body.y) },
    });
    return NextResponse.json({ note: toDTO(created) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "something went wrong - try again" },
      { status: 503 }
    );
  }
}