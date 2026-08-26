-- Sticky-note guestbook wall (components/StickyWall.tsx + /api/guestbook).
-- Anonymous by design; `hidden` is the moderation switch.

CREATE TABLE "WallNote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "msg" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WallNote_createdAt_idx" ON "WallNote"("createdAt");
