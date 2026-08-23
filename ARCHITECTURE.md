# GoHackerz — Platform Architecture

*A HackerNoon-style tech publishing platform.*

---

## 1. What HackerNoon actually is (research summary)

HackerNoon is a **contributor-driven tech publication** — not a traditional newsroom and not a generic blogging site. Its defining characteristics:

### Content model
| Feature | How HackerNoon does it |
|---|---|
| **Who writes** | Open community contributions (~15k+ published writers). Anyone can submit; editors review before publishing. |
| **Editorial flow** | Submit draft → human editor review → edits/suggestions → publish. There is also a "trust tier" where established writers get smoother review. |
| **Categorization** | Flat, SEO-friendly *tech tags/categories* (bitcoin, ai, programming, startup, web3…). Stories can live under multiple tags. Each tag is a browsable landing page. |
| **Monetization** | No paywall. Ads + sponsorships + "brand as author" (companies publish on their own branded sub-sites powered by HackerNoon's engine). |
| **Reader engagement** | Reactions (clap-style, multiple per user), bookmarks, comment threads, follow writers/topics. |
| **Distribution** | Ruthlessly SEO-optimized, daily email newsletters, RSS, AMP-era speed obsession, social syndication. |

### Technical takeaways
1. **Speed & SEO are the product.** Server-rendered/static HTML, perfect Core Web Vitals, clean semantic markup, structured data (JSON-LD `Article`, `Person`).
2. **The editorial pipeline is core**, not an afterthought — submission → review → publish with status tracking.
3. **Content is decoupled from presentation** — the same article data feeds the website, newsletters, RSS, and brand microsites.
4. **Denormalized counters** (reaction counts, view counts) so feed queries stay fast at scale.

---

## 2. Recommended architecture for GoHackerz

```
                        ┌──────────────────────────────┐
                        │           READERS            │
                        └──────────────┬───────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   CDN  (Vercel /        │
                          │   Cloudflare)           │
                          └────────────┬────────────┘
                                       │
┌──────────────┐          ┌────────────▼────────────┐         ┌──────────────┐
│   WRITERS    │          │   NEXT.JS 14 FRONTEND   │◄────────│  Newsletter/ │
│  / EDITORS   ├─────────►│   (App Router, RSC,     │         │  RSS worker  │
└──────────────┘  submit  │   ISR, JSON-LD SEO)     │         └──────────────┘
                          └────────────┬────────────┘
                                       │ API layer
                     ┌─────────────────▼──────────────────┐
                     │      CONTENT BACKEND (choose 1)    │
                     │  A. Headless WordPress (WPGraphQL) │
                     │  B. Payload/Strapi (Node CMS)      │
                     │  C. Custom API + Postgres/Prisma   │
                     └─────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼───────────────────┐
                    │  Supporting services                 │
                    │  • Object storage/S3 + CDN (images)  │
                    │  • Redis (counters, rate limits)     │
                    │  • Email (Resend/SendGrid)           │
                    │  • Search (Meilisearch/Algolia)      │
                    │  • Analytics (Plausible/GA4)         │
                    └──────────────────────────────────────┘
```

### Frontend (already 70% scaffolded in this repo)
- **Next.js 14 App Router + TypeScript + Tailwind** — keep what exists (`app/`, `components/`).
- **Rendering strategy:**
  - Article/topic/writer pages → **ISR** (Incremental Static Regeneration): static-fast like HackerNoon, revalidated on publish/edit via webhook.
  - Home/trending feeds → SSR or short-TTL ISR.
  - Interactive bits (clap, save, follow) → client components hitting API routes.
- **SEO:** JSON-LD structured data, canonical URLs, OG images generated with `next/og`, sitemap.xml, RSS feed route.
- The mock data layer (`lib/data.ts`) already mirrors the final data shapes — swap it for API calls, pages don't change.

### Data model (core entities)
```
User        (id, email, role: reader|writer|editor|admin, profile)
Article     (id, slug, title, subtitle, body[blocks], coverImage,
             status: draft|submitted|in_review|published|rejected,
             authorId, topicIds[], publishedAt, readingTime, seoMeta)
Topic       (id, slug, name, description, heroImage)
Reaction    (articleId, userId, count)      ← denormalized counter on Article
Bookmark    (userId, articleId)
Comment     (id, articleId, userId, parentId?, body)
NewsletterSub (email, confirmedAt)
```

### Editorial pipeline (the HackerNoon differentiator)
```
draft → submitted → [editor queue] → in_review → published
                                  ↘ rejected (with feedback)
```
- Role-based access: writers see their drafts/status; editors see the submission queue.
- On publish → revalidate ISR caches, ping sitemap, trigger newsletter/RSS workers.

---

## 3. Can we leverage WordPress in the backend? **Yes — and here's exactly how.**

WordPress works well as a **headless CMS**: WP owns the admin UI, content storage, and media library; Next.js owns everything the reader sees.

### Headless WordPress setup
```
Writers/Editors ──► WordPress Admin (/wp-admin)
                         │
                         ├── WPGraphQL plugin  ──►  GraphQL API
                         │     (posts, authors, tags, media, custom fields)
                         ├── ACF / Meta Box     ──►  structured fields
                         │     (subtitle, reading time, reviewer notes,
                         │      status workflow)
                         └── JWT / Application passwords ──► authenticated
                              mutations (submit draft, clap, bookmark proxy)

Next.js (this repo)
  • build-time + ISR fetches via GraphQL
  • /api/webhooks/wp  ← WP webhook on publish → revalidate ISR pages
  • reader interactions (claps/bookmarks/comments) → Next.js API routes
    writing to a small Postgres/Redis store (don't fight WP for dynamic data)
```

**Required WP plugins:** WPGraphQL, ACF (+ wp-graphql-acf), WP Webhooks / WPGraphQL revalidation, JWT Authentication, plus hardening (disable XML-RPC, hide `/wp-admin` from public indexing, WAF).

### Honest trade-off analysis

| | **A. Headless WordPress** | **B. Payload/Strapi (Node)** | **C. Custom Postgres+Prisma** |
|---|---|---|---|
| Editor experience | ★★★★★ best-in-class, non-technical editors love it | ★★★☆☆ good but newer | DIY — you'd build it |
| Time to launch | Fastest | Fast | Slowest |
| Editorial workflow plugin | Edit Flow / PublishPress ≈ HackerNoon queue out of the box | Build/configure | Build from scratch |
| Cost | Cheap (a $10–20 VPS or Pantheon/WP Engine) | Cheap (self-host or cloud) | DB + API hosting |
| Dynamic features (claps, follows) | Keep OUT of WP — small Node service beside it | Same service, one runtime | Native, cleanest |
| Risks | Plugin/security upkeep; two systems to run | Smaller ecosystem than WP | Most engineering effort |
| Scales to HackerNoon traffic? | Yes, if WP is admin-only + CDN-cached reads | Yes | Yes |

### Recommendation
- **If your team is content/marketing-heavy and wants to launch fast:** ✅ **Headless WordPress (Option A)** — use WP purely as the writing desk + content store, keep all reader-facing dynamics in Next.js API routes + a lightweight Postgres/Redis. This gets you HackerNoon's editorial workflow almost for free via PublishPress/Edit Flow.
- **If your team is engineering-heavy and wants one unified codebase:** Option B (Payload CMS — TypeScript-native, pairs beautifully with Next.js).
- **Avoid** running WordPress as the *public-facing* site (classic theme WP) — you'd lose the performance/SEO control that makes HackerNoon work, and this repo's Next.js frontend would go to waste.

---

## 4. Phased delivery plan

| Phase | Scope |
|---|---|
| **P0 — Foundation** | Wire existing Next.js app to chosen backend; real auth (NextAuth); migrate mock data shapes to real schema |
| **P1 — Publishing** | Submission → review → publish workflow; editor dashboard; ISR + webhook revalidation; JSON-LD/sitemap/RSS |
| **P2 — Engagement** | Claps, bookmarks, comments, follow writers/topics; trending algorithm on denormalized counters |
| **P3 — Growth** | Newsletters, SEO program, writer stats dashboards, "brand as author" spaces (HackerNoon's business model) |
| **P4 — Scale** | Search (Meilisearch), image pipeline (S3+Cloudflare Images), analytics, moderation tooling |

---

## 5. Hosting sketch (WordPress variant)

- **Frontend:** Vercel (Next.js) — free tier suffices to start.
- **WordPress:** small VPS (DigitalOcean/Hetzner) or managed WP; locked down to admin IPs + Cloudflare in front.
- **Dynamic store:** Neon/Supabase Postgres + Upstash Redis (serverless-friendly).
- **Media:** WP media library proxied through Cloudflare, or offload to S3 + CloudFront.