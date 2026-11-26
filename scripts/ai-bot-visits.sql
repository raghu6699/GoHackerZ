-- AI / search crawler page views for /admin/ai-visits. No visitor data.
create table if not exists "AiBotVisit" (
  "id" text primary key,
  "bot" text not null,
  "path" text not null,
  "userAgent" text,
  "createdAt" timestamp(3) without time zone not null default current_timestamp
);
create index if not exists "AiBotVisit_createdAt_idx" on "AiBotVisit"("createdAt");
create index if not exists "AiBotVisit_bot_idx" on "AiBotVisit"("bot");
-- Not readable through Supabase's public API; the app connects as the database owner.
alter table "AiBotVisit" enable row level security;
