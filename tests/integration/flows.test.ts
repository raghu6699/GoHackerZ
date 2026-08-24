/**
 * Integration tests: real route handlers + real Postgres.
 *
 * Requires TEST_DATABASE_URL (CI provisions one via GitHub Actions service
 * container; locally the whole suite is skipped so `npm test` stays green
 * without infrastructure).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("@/lib/profile", () => ({ getCurrentDbUser: vi.fn() }));

import { getCurrentDbUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { POST as publishArticle } from "@/app/api/articles/route";
import { POST as reactToArticle } from "@/app/api/articles/[slug]/react/route";
import { POST as toggleFollow } from "@/app/api/writers/[username]/follow/route";
import { POST as reviewDecision } from "@/app/api/review/[slug]/route";
import { searchArticles } from "@/lib/queries";

const mockUser = getCurrentDbUser as unknown as ReturnType<typeof vi.fn>;
type DbUser = NonNullable<Awaited<ReturnType<typeof getCurrentDbUser>>>;

const hasDb = !!process.env.TEST_DATABASE_URL;
const d = hasDb ? describe : describe.skip;

const RUN = `it${Date.now().toString(36)}`;
let writer: DbUser;
let editor: DbUser;

function jsonReq(url: string, body?: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

d("flows: publish → review → react → follow", () => {
  beforeAll(async () => {
    await prisma.topic.upsert({
      where: { slug: `${RUN}-topic` },
      update: {},
      create: { slug: `${RUN}-topic`, name: "Integration Test Topic", emoji: "🧪" },
    });
    writer = (await prisma.user.create({
      data: {
        email: `${RUN}-w@test.local`, name: "IT Writer",
        username: `${RUN}-w`, role: "WRITER", trustLevel: 0,
      },
    })) as DbUser;
    editor = (await prisma.user.create({
      data: {
        email: `${RUN}-e@test.local`, name: "IT Editor",
        username: `${RUN}-e`, role: "EDITOR", trustLevel: 5,
      },
    })) as DbUser;
  });

  afterAll(async () => {
    // FK-safe teardown in dependency order
    const articles = await prisma.article.findMany({
      where: { topic: { slug: `${RUN}-topic` } },
      select: { id: true },
    });
    const ids = articles.map((a) => a.id);
    await prisma.reaction.deleteMany({ where: { articleId: { in: ids } } });
    await prisma.bookmark.deleteMany({ where: { articleId: { in: ids } } });
    await prisma.comment.deleteMany({ where: { articleId: { in: ids } } });
    await prisma.reviewComment.deleteMany({ where: { articleId: { in: ids } } });
    await prisma.article.deleteMany({ where: { id: { in: ids } } });
    if (writer && editor) {
      await prisma.follow.deleteMany({
        where: { OR: [{ followerId: writer.id }, { followingId: editor.id }] },
      });
    }
    await prisma.user.deleteMany({ where: { email: { startsWith: `${RUN}-` } } });
    await prisma.topic.deleteMany({ where: { slug: `${RUN}-topic` } });
    await prisma.$disconnect();
  });

  const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

  it("runs the full approve path: SUBMITTED → PUBLISHED with publishedAt set", async () => {
    mockUser.mockResolvedValue(writer);
    const created = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: `Approve me ${RUN}`,
        topicSlug: `${RUN}-topic`,
        body: "Body for approval.",
        draft: false,
      })
    );
    const slug = (await created.json()).slug as string;

    // A non-editor cannot approve.
    mockUser.mockResolvedValue(writer);
    const forbidden = await reviewDecision(jsonReq(`http://localhost/api/review/${slug}`, { action: "approve" }), ctx(slug));
    expect(forbidden.status).toBe(403);

    // Editor approves.
    mockUser.mockResolvedValue(editor);
    const ok = await reviewDecision(jsonReq(`http://localhost/api/review/${slug}`, { action: "approve" }), ctx(slug));
    expect(ok.status).toBe(200);
    const row = await prisma.article.findUniqueOrThrow({ where: { slug } });
    expect(row.status).toBe("PUBLISHED");
    expect(row.publishedAt).not.toBeNull();

    // Double-review is rejected: no longer awaiting review.
    const again = await reviewDecision(jsonReq(`http://localhost/api/review/${slug}`, { action: "approve" }), ctx(slug));
    expect(again.status).toBe(400);
  });

  it("reject requires feedback and records a ReviewComment", async () => {
    mockUser.mockResolvedValue(writer);
    const created = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: `Reject me ${RUN}`,
        topicSlug: `${RUN}-topic`,
        body: "Body for rejection.",
        draft: false,
      })
    );
    const slug = (await created.json()).slug as string;
    mockUser.mockResolvedValue(editor);

    const noFeedback = await reviewDecision(jsonReq(`http://localhost/api/review/${slug}`, { action: "reject" }), ctx(slug));
    expect(noFeedback.status).toBe(400);

    const ok = await reviewDecision(
      jsonReq(`http://localhost/api/review/${slug}`, { action: "reject", feedback: "Add benchmarks." }),
      ctx(slug)
    );
    expect(ok.status).toBe(200);
    const row = await prisma.article.findUniqueOrThrow({ where: { slug } });
    expect(row.status).toBe("REJECTED");
    expect(row.rejectionFeedback).toBe("Add benchmarks.");
    const comments = await prisma.reviewComment.findMany({ where: { articleId: row.id } });
    expect(comments).toHaveLength(1);
  });

  it("toggles reactions transactionally with correct denormalized counter", async () => {
    mockUser.mockResolvedValue(writer);
    const created = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: `React target ${RUN}`,
        topicSlug: `${RUN}-topic`,
        body: "React to me.",
        draft: true,
      })
    );
    const slug = (await created.json()).slug as string;
    const react = () => reactToArticle(jsonReq(`http://localhost/api/articles/${slug}/react`), ctx(slug));

    mockUser.mockResolvedValue(editor);
    expect(await (await react()).json()).toMatchObject({ reacted: true, count: 1 });
    expect(await (await react()).json()).toMatchObject({ reacted: false, count: 0 });
    expect(await (await react()).json()).toMatchObject({ reacted: true, count: 1 });

    const row = await prisma.article.findUniqueOrThrow({ where: { slug } });
    const reactionRows = await prisma.reaction.findMany({ where: { articleId: row.id } });
    expect(reactionRows).toHaveLength(1); // no drift between rows and counter
    expect(row.reactionCount).toBe(1);
  });

  it("returns 401 when reacting while signed out", async () => {
    mockUser.mockResolvedValue(null);
    const res = await reactToArticle(jsonReq("http://localhost/api/articles/nope/react"), ctx("nope"));
    expect(res.status).toBe(401);
  });

  it("toggles follows and blocks self-follows", async () => {
    mockUser.mockResolvedValue(editor);
    const follow = () =>
      toggleFollow(jsonReq(`http://localhost/api/writers/${RUN}-w/follow`), {
        params: Promise.resolve({ username: `${RUN}-w` }),
      } as unknown as Parameters<typeof toggleFollow>[1]);

    expect(await (await follow()).json()).toMatchObject({ following: true, followers: 1 });
    expect(await (await follow()).json()).toMatchObject({ following: false, followers: 0 });

    const selfRes = await toggleFollow(jsonReq(`http://localhost/api/writers/${RUN}-e/follow`), {
      params: Promise.resolve({ username: `${RUN}-e` }),
    } as unknown as Parameters<typeof toggleFollow>[1]);
    expect(selfRes.status).toBe(400);
  });

  it("full-text search ranks matching titles above non-matches", async () => {
    mockUser.mockResolvedValue(editor);
    await publishArticle(jsonReq("http://localhost/api/articles", {
      title: `Quantum debugging postmortem ${RUN}`,
      dek: "When qubits lie to your stack traces.",
      topicSlug: `${RUN}-topic`,
      body: "Deep dive content.",
      draft: false,
    }));
    await publishArticle(jsonReq("http://localhost/api/articles", {
      title: `Totally unrelated cooking guide ${RUN}`,
      dek: "Pasta basics.",
      topicSlug: `${RUN}-topic`,
      body: "Boil water.",
      draft: false,
    }));

    const results = await searchArticles(`quantum debugging ${RUN}`);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain("Quantum debugging");
    expect(results.some((a) => a.title.includes("cooking"))).toBe(false);
  });

  it("gates untrusted writers into the review queue instead of publishing", async () => {
    mockUser.mockResolvedValue(writer);
    const res = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: `Trust gate ${RUN}`,
        dek: "How the editorial pipeline works.",
        topicSlug: `${RUN}-topic`,
        body: "A body about latency **and** correctness.",
        draft: false,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("SUBMITTED"); // NOT published

    const row = await prisma.article.findUniqueOrThrow({ where: { slug: data.slug } });
    expect(row.status).toBe("SUBMITTED");
    expect(row.publishedAt).toBeNull();
  });

  it("publishes instantly for editors and stores parsed blocks", async () => {
    mockUser.mockResolvedValue(editor);
    const res = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: `Editor fast lane ${RUN}`,
        topicSlug: `${RUN}-topic`,
        body: "## Head\n\n- item\n\n```ts\nlet x = 1;\n```",
        draft: false,
      })
    );
    const data = await res.json();
    expect(data.status).toBe("PUBLISHED");
    const row = await prisma.article.findUniqueOrThrow({ where: { slug: data.slug } });
    expect(row.publishedAt).not.toBeNull();
    const content = row.content as { type: string }[];
    expect(content.map((b) => b.type)).toEqual(["h2", "ul", "code"]);
  });

  it("rejects invalid payloads with 400", async () => {
    mockUser.mockResolvedValue(editor);
    const empty = await publishArticle(
      jsonReq("http://localhost/api/articles", { title: "", topicSlug: "", body: "" })
    );
    expect(empty.status).toBe(400);
    const badTopic = await publishArticle(
      jsonReq("http://localhost/api/articles", {
        title: "x", topicSlug: "does-not-exist-xyz", body: "x",
      })
    );
    expect(badTopic.status).toBe(400);
  });
});

