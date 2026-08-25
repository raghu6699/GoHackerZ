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
const COLORS = 5;
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

  const msg = typeof body.msg === "string" ? body.msg.trim().slice(0, MSG_MAX) : "";
  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, NAME_MAX) : "";
  if (!msg) {
    return NextResponse.json({ error: "write something first!" }, { status: 400 });
  }

  const fakeNote = (): NextResponse => {
    const id = Math.random().toString(36).slice(2, 10);
    return NextResponse.json(
      {
        note: {
          id,
          name,
          msg,
          ts: Math.floor(Date.now() / 1000),
          color: 0,
          x: 0.5,
          y: 0.5,
        },
      },
      { status: 201 }
    );
  };
  // Honeypot tripped: answer like a success so the bot thinks it landed,
  // but store nothing. Same for absurd payloads missing coordinates.
  if (typeof body.web === "string" && body.web.length > 0) return fakeNote();

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