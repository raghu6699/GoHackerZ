# GoHackerz — MVP

The **Design-6 "Playful"** direction, built as a real Next.js 14 app.

Sticker shadows, chunky borders, lime highlighter, rounded everything — the
aesthetic engineers and Gen-Z fell in love with, now clickable across six page
types.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** with a custom "playful" theme (`tailwind.config.ts`)
- **In-memory mock data** (`lib/data.ts`) shaped exactly like the Postgres/Prisma
  models in the HLD/LLD, so swapping to a real DB later is a drop-in.
- No external UI libraries — every component is hand-built.

## Pages

| Route | What it is |
|-------|------------|
| `/` | Home feed — hero, featured headliner, fresh drops, trending, topics, newsletter |
| `/article/[slug]` | Article reader — byline, clap/save actions, styled body, author card, related |
| `/topic/[slug]` | Topic page — header, topic switcher, filtered grid |
| `/writer/[username]` | Writer profile — bio, stats, their essays |
| `/write` | Distraction-free editor with a **live playful preview** |
| `/signin` · `/signup` | Auth screens (magic-link demo, social buttons) |
| `*` | Custom playful 404 |

Interactive bits (clap, save, newsletter, editor, auth) run client-side with
mock state — no backend needed to demo the full experience.

## Run it

> ⚠️ **Heads up:** dependencies aren't installed yet. On the machine where this
> was created, the network blocked the public npm registry (`503` on every
> request through the corporate proxy). Run these on a network that allows npm,
> or point npm at your company's mirror first.

```bash
cd GOHACKERZ
npm install
npm run dev
```

Then open http://localhost:3000.

### If you're behind the same corporate proxy

The TLS interception was already handled by trusting the Windows cert store — a
CA bundle was written to `../corp-ca-bundle.pem` and set as npm's `cafile`. The
remaining blocker was the registry returning `503`. Options:

1. Run `npm install` off the corporate network (home / hotspot / VPN split), **or**
2. Point npm at your internal mirror:
   ```bash
   npm config set registry https://<your-artifactory-or-nexus>/npm/
   ```

## Where this maps to the architecture

- `lib/data.ts` types (`Author`, `Topic`, `Article`, `Block`) mirror the Prisma
  schema in the LLD. Replace the arrays with Prisma queries and the pages don't
  change.
- The `/write` publish flow is where the LLD's trust-based auto-publish pipeline
  plugs in.
- Reactions/bookmarks use denormalized counters (as designed in the HLD to fix
  the feed-algorithm counter bug).

## Project layout

```
GOHACKERZ/
├─ app/
│  ├─ layout.tsx            # nav + footer shell, fonts
│  ├─ page.tsx              # home feed
│  ├─ globals.css           # playful design tokens & component classes
│  ├─ not-found.tsx
│  ├─ article/[slug]/page.tsx
│  ├─ topic/[slug]/page.tsx
│  ├─ writer/[username]/page.tsx
│  ├─ write/page.tsx
│  ├─ signin/page.tsx
│  └─ signup/page.tsx
├─ components/              # Nav, Footer, ArticleCard, Avatar, forms, …
├─ lib/data.ts             # mock content + helpers
└─ tailwind.config.ts      # playful theme (colors, pop shadows, fonts)
```
