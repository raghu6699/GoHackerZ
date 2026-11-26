-- Sponsor campaigns and their impression / click events (see /admin/sponsors).
-- Safe to run more than once.
create table if not exists "SponsorCampaign" (
  "id" text primary key,
  "sponsor" text not null,
  "placement" text not null,
  "headline" text not null,
  "body" text not null,
  "ctaLabel" text not null,
  "url" text not null,
  "logoUrl" text,
  "tagline" text,
  "tags" text[] not null default array[]::text[],
  "startsAt" timestamp(3) without time zone not null default current_timestamp,
  "endsAt" timestamp(3) without time zone,
  "priceInr" integer,
  "active" boolean not null default true,
  "notes" text,
  "createdAt" timestamp(3) without time zone not null default current_timestamp,
  "updatedAt" timestamp(3) without time zone not null default current_timestamp
);
create index if not exists "SponsorCampaign_placement_active_idx" on "SponsorCampaign"("placement", "active");

create table if not exists "SponsorEvent" (
  "id" text primary key,
  "campaignId" text not null references "SponsorCampaign"("id") on delete cascade on update cascade,
  "kind" text not null,
  "path" text,
  "createdAt" timestamp(3) without time zone not null default current_timestamp
);
create index if not exists "SponsorEvent_campaignId_kind_createdAt_idx" on "SponsorEvent"("campaignId", "kind", "createdAt");
create index if not exists "SponsorEvent_createdAt_idx" on "SponsorEvent"("createdAt");

-- Not readable through Supabase's public API; the app connects as the database owner.
alter table "SponsorCampaign" enable row level security;
alter table "SponsorEvent" enable row level security;

-- First campaign: CareConnect in the sponsored card. Edit the copy at /admin/sponsors.
insert into "SponsorCampaign" ("id", "sponsor", "placement", "headline", "body", "ctaLabel", "url", "logoUrl", "tagline", "tags")
values (
  'careconnect-card',
  'CareConnect',
  'card',
  'CareConnect: AI-powered telemedicine',
  'CareConnect is an AI-powered telemedicine company, and the partner behind the Founder''s Office opportunity for the Bolo & Build winner.',
  'Visit CareConnect',
  'https://www.careconnect.in/',
  '/events/careconnect-logo.png',
  'Healthcare partner',
  array['healthtech', 'ai']
)
on conflict ("id") do nothing;
