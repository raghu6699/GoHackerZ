# GoHackerz — Operations Blueprint

*Replicating exactly how HackerNoon operates, feature by feature.*

Companion to `ARCHITECTURE.md` (the "how it's built"). This is the "how it runs."

---

## 1. The HackerNoon Operating Model — deconstructed

HackerNoon is not just software. It's **five interlocking operations**:

1. **Content Supply Chain** — a machine that turns community submissions into published, edited stories at scale.
2. **Writer Lifecycle Management** — recruiting, onboarding, retaining, and promoting writers.
3. **Distribution Engine** — SEO + newsletters + syndication that turns one story into many traffic streams.
4. **Monetization Machine** — ads, sponsorships, and "Brand as Author" business publishing.
5. **Trust & Safety** — plagiarism/AI screening, moderation, takedown handling.

Below: what HackerNoon does in each, and exactly how GoHackerz replicates it.

---

## 2. Content Supply Chain (Editorial Operations)

### What HackerNoon does
- Anyone signs up and submits a draft through their dashboard.
- Drafts enter an **editor queue**. Editors review for quality, originality, formatting, and fit with tech categories.
- Writers get feedback; revisions go back and forth inside the platform.
- Accepted stories are scheduled, given a final copyedit, headline optimization, image/cover treatment, then published under a topic.
- Established writers earn **trust tiers**: fewer review gates, faster turnaround.
- Stories are never paywalled; editors optimize headlines for search intent.

### GoHackerz replication (build these)

| Operation | Feature to build | Where |
|---|---|---|
| Submission | `/write` editor (already scaffolded) → "Submit for Review" action sets status `submitted` | Next.js API route |
| Editor queue | `/dashboard/editor` — table of submitted drafts with filters (topic, date, new/returning author) | New page + role gate |
| Review loop | Inline comments on blocks, revision history, status transitions `in_review ⇄ submitted`, reject-with-feedback | Postgres tables `review_comments`, `revisions` |
| Scheduling | Editors set `scheduledAt`; cron worker publishes + revalidates ISR | Vercel Cron |
| Copyedit pass | Final "editor lock" step where editor tweaks title/subtitle/SEO fields before publish | Editor UI |
| Trust tiers | Writer level = f(published count, rejection rate, tenure). Tier 1+ skips initial review or gets auto-publish after spot-checks | `users.trust_level` column + rules engine |
| Style guide | Public contribution guidelines page (`/publish`) like HackerNoon's — rules on AI content, plagiarism, self-promo limits | Static page |

### Editorial SLAs (copy these numbers)
- First review response: **≤ 48h**
- Publish after approval: **≤ 72h**
- Rejection always includes written feedback.

---

## 3. Writer Lifecycle Management

### What HackerNoon does
- Open registration; low barrier to first submission.
- Writer profiles act as portfolios (bio, avatar, all stories, stats).
- Gamification: top-writer lists, badges, "writer of the day," contest winners.
- Direct line to editors via dashboard notifications.
- Writing contests/monthly prompts to keep supply flowing.

### GoHackerz replication

| Operation | Feature to build |
|---|---|
| Onboarding | Signup → guided "write your first story" flow + contribution guidelines checkbox |
| Portfolio profile | `/writer/[username]` (already scaffolded) + add lifetime stats: views, claps, streak |
| Notifications | In-app + email: "your story moved to In Review", "published", "editor left feedback" |
| Leaderboards | `/top-writers` computed weekly from denormalized counters |
| Contests/Prompts | Admin-created "prompt" topics (e.g., #gohackerz-ai-contest); tagged stories enter the contest; winner banner on home |
| Writer dashboard | `/dashboard` — my drafts, my published, per-story analytics, submission status timeline |

---

## 4. Distribution Engine

### What HackerNoon does
- **SEO-first everything:** semantic HTML, JSON-LD, fast static pages, keyword-intentional headlines, topic hub pages that rank.
- **Daily newsletter:** curated best stories, segmented by interest.
- **RSS feeds** per topic and sitewide.
- **Social syndication:** auto-posts to X/LinkedIn/Telegram per story.
- **Homepage programming:** featured headliner, trending, fresh drops — refreshed continuously.
- **Evergreen recycling:** old stories resurfaced via topic pages and "from the archive" slots.

### GoHackerz replication

| Operation | Feature to build |
|---|---|
| SEO | JSON-LD (`Article`, `Person`, `BreadcrumbList`), canonical URLs, `next/og` dynamic OG images, `sitemap.xml` route, `robots.txt` |
| Topic hubs | `/topic/[slug]` (already scaffolded) with intro copy + internal linking — these are the ranking pages |
| Newsletter | Daily digest worker: pick top N by 24h engagement → Resend/SendGrid template; double opt-in subs |
| RSS | `/feed.xml` route + per-topic feeds |
| Social autopost | On publish webhook → Buffer/Zapier-style worker posts to social accounts |
| Homepage programming | Curated slots (headliner = editor-picked flag; trending = engagement score; fresh = recency) |
| Archive resurfacing | Weekly job promotes 3 evergreen stories to home "classics" slot |

---

## 5. Monetization Machine

### What HackerNoon does
1. **Display ads/sponsorships** across article pages and newsletters (no paywall).
2. **"Brand as Author":** companies pay for branded publishing spaces — their own microsite/profile powered by the same engine, with disclosed sponsorship labels.
3. **Sponsored topics/contests:** brands sponsor a tag or writing contest.
4. **Newsletter sponsorships:** paid slots in the daily digest.

### GoHackerz replication

| Revenue stream | Feature to build |
|---|---|
| Display ads | Ad slot components (article sidebar, in-feed) served from an internal `campaigns` table or ad network integration; view/click counters in Redis |
| Brand as Author | `organization` accounts: verified brand profile page (`/brand/[name]`), multi-author support, sponsored-label rendering on stories (`isSponsored` flag → disclosure badge, required) |
| Sponsored topics | Topic page header slot + contest sponsorship flag |
| Newsletter ads | Sponsor row in digest template; booking calendar later |
| Analytics for sponsors | Per-campaign impressions/clicks dashboard |

---

## 6. Trust & Safety Operations

### What HackerNoon does
- Plagiarism screening before publish.
- Clear AI-generated content policy (disclosure requirements).
- Community reporting + editor takedown powers.
- Contributor agreement at signup (licensing terms).

### GoHackerz replication

| Operation | Feature to build |
|---|---|
| Plagiarism check | On submit → call Copyleaks/Originality API → score attached to submission in editor queue |
| AI policy | Disclosure field in submission form; policy page; editors see AI-disclosure flag in queue |
| Reporting | Report button on articles/comments → moderation queue for admins |
| Takedowns | Admin actions: unpublish, ban author, with audit log |
| Legal | Contributor Agreement at signup (non-exclusive license to publish); DMCA contact + process page |

---

## 7. Team needed to run this (day-one minimum)

| Role | Count | Owns |
|---|---|---|
| Editor-in-Chief | 1 | Style guide, headline standards, final calls |
| Editors (community) | 1–3 (can start volunteer/revenue-share) | Review queue, SLA compliance |
| Community manager | 1 | Writer recruitment, contests, social accounts |
| Growth/SEO | 1 | Keyword strategy, topic hubs, newsletter growth |
| Engineer(s) | 1–2 | Build/maintain the platform features above |

HackerNoon famously runs lean with distributed editors — the *software carries most of the process*, which is why we build the pipeline rather than doing it manually.

---

## 8. KPIs to run the operation against

| Area | Metric | Early target |
|---|---|---|
| Supply | Submissions/week; submission→publish rate | 20+/wk; >60% |
| Editorial | Median review time; rejection-with-feedback % | <48h; 100% |
| Audience | Organic sessions; newsletter CTR; return visitor % | growing WoW |
| Engagement | Claps/story, comments/story, bookmark rate | baseline P2 |
| Writers | WAU writers; retention @90 days; tier upgrades | growing |
| Revenue | Ad fill/sponsor deals signed; brand accounts | first deal by P3 |

---

## 9. Build order mapping (ops → engineering phases)

| Ops capability | Architecture phase (from ARCHITECTURE.md) |
|---|---|
| Submission + review pipeline | P0–P1 |
| Writer dashboards, notifications, trust tiers | P1–P2 |
| Claps/bookmarks/comments/leaderboards | P2 |
| Newsletter, RSS, social autopost, SEO stack | P1 + P3 |
| Ads, Brand-as-Author, sponsor analytics | P3 |
| Plagiarism/AI screening, moderation, reports | P1 (basic) → P4 (full) |

**Bottom line:** to operate exactly like HackerNoon, the platform must implement the *submission→review→publish pipeline, trust tiers, topic-hub SEO, daily newsletter, and brand publishing* as first-class product features — not manual processes. Everything in sections 2–6 above is scoped to be built on the architecture already defined in `ARCHITECTURE.md`.