"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";
import { isHttpUrl, isPlacement } from "@/lib/sponsors";

// Server Actions are reachable by direct POST, so every action checks admin itself.
async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || !isUserAdmin(user)) throw new Error("Unauthorized");
}

function fail(message: string): never {
  redirect(`/admin/sponsors?error=${encodeURIComponent(message)}`);
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Dates come from <input type="date"> and are read as India time; an end date runs to the end of that day. */
function istDate(v: string, endOfDay: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T${endOfDay ? "23:59:59" : "00:00:00"}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parse(fd: FormData) {
  const sponsor = str(fd, "sponsor");
  const placement = str(fd, "placement");
  const headline = str(fd, "headline");
  const body = str(fd, "body");
  const ctaLabel = str(fd, "ctaLabel");
  const url = str(fd, "url");
  const logoUrl = str(fd, "logoUrl");
  const price = str(fd, "priceInr");

  if (!sponsor || !headline || !body || !ctaLabel) fail("Sponsor, headline, text and button label are required.");
  if (!isPlacement(placement)) fail("Pick a placement.");
  if (!isHttpUrl(url)) fail("The link must start with https:// or http://.");
  if (logoUrl && !logoUrl.startsWith("/") && !isHttpUrl(logoUrl)) fail("The logo must be a site path like /events/logo.png or a full URL.");
  if (price && !/^\d+$/.test(price)) fail("Price must be a whole number of rupees.");

  const startsAt = istDate(str(fd, "startsAt"), false) ?? new Date();
  const endsAt = istDate(str(fd, "endsAt"), true);
  if (endsAt && endsAt <= startsAt) fail("The end date must be after the start date.");

  return {
    sponsor: sponsor.slice(0, 80),
    placement,
    headline: headline.slice(0, 140),
    body: body.slice(0, 400),
    ctaLabel: ctaLabel.slice(0, 40),
    url,
    logoUrl: logoUrl || null,
    tagline: str(fd, "tagline").slice(0, 60) || null,
    tags: str(fd, "tags").split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 5),
    startsAt,
    endsAt,
    priceInr: price ? Number(price) : null,
    notes: str(fd, "notes").slice(0, 1000) || null,
  };
}

function done() {
  revalidatePath("/admin/sponsors");
  revalidatePath("/");
}

export async function createCampaign(fd: FormData) {
  await requireAdmin();
  await prisma.sponsorCampaign.create({ data: parse(fd) });
  done();
}

export async function updateCampaign(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) fail("Missing campaign.");
  await prisma.sponsorCampaign.update({ where: { id }, data: parse(fd) });
  done();
}

export async function setCampaignActive(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) fail("Missing campaign.");
  await prisma.sponsorCampaign.update({ where: { id }, data: { active: str(fd, "active") === "true" } });
  done();
}
