# VideoEV AdServer — CLAUDE.md
> **ads.videoev.com** · VAST 4.0 ad decision engine + interactive sandbox demo
> Next.js 16 App Router · TypeScript · Tailwind CSS 4 · Prisma 7 · Neon PostgreSQL · Vercel

This file is Claude's persistent memory for this project. Read it at the start of every session.

---

## GitHub

- **Remote**: `https://github.com/anundloll/videoev-adserver.git` (origin)
- **Branch**: `main` (single branch)
- **Push**: `git push` (tracking configured)

---

## What this product is

This is a **multi-domain Next.js 16 monorepo** — one app, three route groups, three domains:

| Domain | Route group | Purpose |
|---|---|---|
| `ads.videoev.com` | `(adserver)` | VAST 4.0 ad decision engine + interactive sandbox + Campaign Admin |
| `mc.videoev.com` | `(marketing)` | Mission Control — master nav page + full platform docs |
| `data.videoev.com` (adserver copy) | `(data)` | Data dashboard (also in `../videoev-dashboard`) |

### `(adserver)` — ads.videoev.com
1. **Ad decision API** (`/api/decision`) — VAST 4.0, 9 targeting signals, DB-first auction
2. **Interactive sandbox** (`/adserver`) — kiosk UI with live VAST tag debugger
3. **API docs** (`/adserver/docs`) — full endpoint reference
4. **Campaign Admin** (`/adserver/admin/campaigns`) — three-column DB campaign manager

### `(marketing)` — mc.videoev.com
- **Mission Control** (`/marketing/mission-control`) — master hub: nav cards to all services, system vitals, API endpoints, infra links, Live Data Explorer
- **Platform Docs** (`/marketing/mission-control/docs`) — full platform README with TOC: Platform Overview · Architecture · all 4 domains · Infrastructure · End-to-End Data Flow · API Reference
- `MissionControl.tsx` — `"use client"` component; server page passes `maskedDb`, `vercelEnv`, `region` props (DATABASE_URL never reaches client)

### `(data)` — data route (also served from `../videoev-dashboard`)
- `app/(data)/data/page.tsx` + `DataDashboard.tsx` — publisher analytics dashboard (mirrors videoev-dashboard repo)

The companion demo app is at `../videoev-demo` (demo.videoev.com) — the full kiosk/mobile/in-car charging flow.

---

## Dev server

```bash
npm run dev   # port 3004 (via launch.json) or default 3000
```

`launch.json` in `../videoev-demo/.claude/` has the entry:
```json
{ "name": "videoev-adserver", "runtimeExecutable": "bash",
  "runtimeArgs": ["-c", "cd /Users/arvinnundloll/Desktop/videoev-adserver && npm run dev -- --port 3004"],
  "port": 3004 }
```

---

## Architecture

### File map

```
app/
  layout.tsx                                     — root layout
  globals.css                                    — global styles
  (adserver)/adserver/
    page.tsx                                     — interactive sandbox kiosk UI ("use client")
    docs/page.tsx                                — API reference documentation page
    plugin/demo/page.tsx                         — plugin integration demo (8 scenarios)
    admin/
      campaigns/page.tsx                         — Campaign Admin Portal UI ("use client")
      api/campaigns/route.ts                     — GET (list) + POST (create) campaigns
  (marketing)/marketing/
    page.tsx                                     — marketing root (redirects to mission-control)
    MissionControl.tsx                           — "use client" Mission Control UI component
    mission-control/
      page.tsx                                   — server page: reads env, passes masked props to MissionControl
      docs/page.tsx                              — full platform docs ("use client", TOC sidebar + anchored sections)
  (data)/data/
    page.tsx                                     — data dashboard server component
    DataDashboard.tsx                            — client component
  api/
    decision/route.ts                            — VAST 4.0 ad decision engine (DB-first)
    track/route.ts                               — pixel tracker → writes TrackingEvent rows
components/
  ImaPlayer.tsx                                  — VideoAd: resolves VAST XML → plays S3 .mp4
lib/
  prisma.ts                                      — singleton PrismaPg client (Prisma 7)
  ad-generator.ts                                — generates 315-ad static AD_BANK (fallback)
  generated/prisma/                              — auto-generated Prisma client (gitignored)
prisma/
  schema.prisma                                  — Campaign + TrackingEvent models
  migrations/20260331181735_init/                — initial migration (applied to Neon)
prisma.config.ts                                 — Prisma 7 CLI datasource config
```

### API routes

#### `GET /api/decision` — Ad decision engine
Returns VAST 4.0 XML. Accepts 9 targeting params (see table below).

**Rules waterfall** (evaluated in priority order):
| Priority | Signal | Creative | CPM |
|---|---|---|---|
| 0 | `weather=rainy` | Starbucks | $38 |
| 1 | `location=school` | Instacart | $20 |
| 2 | `battery=15` | Uber Eats | $28 |
| 3 | `car_make=*` | Vehicle→brand map (11 entries) | Var. |
| 4 | (no match) | Amazon (fallback) | $18 |

**9 targeting parameters:**
| Param | Type | Default | Notes |
|---|---|---|---|
| `car_make` | String | — | lowercase: tesla, porsche, rivian, bmw, lucid, volvo, jaguar, cadillac, ford, polestar, genesis |
| `battery` | Integer | `80` | SoC 0–100; `15` triggers low-battery rule |
| `location` | String | `highway` | `school` triggers brand safety rule |
| `venue` | String | `luxury_retail` | luxury_retail, grocery, highway_rest |
| `msrp` | String | `120k+` | 120k+, 80k-120k |
| `dwell` | Integer | `45` | Estimated charging time in minutes |
| `weather` | String | `sunny` | sunny, rainy, cloudy |
| `time` | String | `morning` | morning, afternoon, evening |
| `traffic` | String | `low` | low, medium, high |

**Vehicle → brand mapping** (in `AD_MAP`):
| Vehicle | Brand | CPM |
|---|---|---|
| tesla | Apple | $42 |
| porsche | Capital One | $45 |
| lucid | Maybelline | $50 |
| bmw | Oakley | $38 |
| ford | Nike | $34 |
| rivian | Rivian | $32 |
| genesis | Planet Fitness | $22 |
| cadillac | Nike | $48 |
| jaguar | XFINITY | $40 |
| polestar | T-Mobile | $30 |
| volvo | Rocket + Redfin | $35 |

**VAST XML Extensions** — every response includes:
```xml
<Extension type="VideoEV">
  <Brand>...</Brand><CPM>...</CPM><Network>VideoEV AdCP</Network>
  <VenueType>...</VenueType><MSRPProxy>...</MSRPProxy>
  <EstDwellTime>... mins</EstDwellTime>
  <Weather>...</Weather><TimeOfDay>...</TimeOfDay><TrafficDensity>...</TrafficDensity>
</Extension>
```

#### `GET /api/track` — Pixel tracker + attribution
Returns 1×1 transparent GIF. Params: `event`, `brand`, `cpm`, `campaign_id`, `session_id`.
Events fired from VAST: `impression`, `start`, `q1`, `midpoint`, `q3`, `complete`, `error`.
When `campaign_id` is present (DB-backed campaigns only), inserts a `TrackingEvent` row.
Write is fire-and-forget — pixel returns instantly regardless of DB latency.

#### `GET /admin/api/campaigns` — List campaigns
Returns all `Campaign` rows ordered by `createdAt DESC` with `_count.trackingEvents`.

#### `POST /admin/api/campaigns` — Create campaign
Body: `{ brandName, sector, baseCpm, videoUrl, conversionType, ctaCopy, targetingRules }`.
`targetingRules` shape: `{ bidMultipliers: { rain, lowBattery, weekend }, targetAffinities: string[] }`.

---

## Sandbox UI (`app/page.tsx`)

Single `"use client"` file — all state and rendering in `KioskPage()`.

### Charging simulation state
- `VEHICLES` array — 8 vehicles, each with `make`, `label`, `start` battery, `target` battery, `rate`
- `Stage` type: `start | connect | auth | initiating | starting | charging | complete`
- `AdPhase` type: `warmup | display | video_1 | video_2`
- `CHARGE_RATE = 0.18` — % per second in demo
- Video ads fire at 35% and 70% of the charging range, plus on completion
- `VIDEO_ADS` — 3 video ads per vehicle (brand, S3 URL, CPM)
- `DISPLAY_ADS` — 7 display/banner ads shown between video ads
- `FALLBACK_ADS` — Amazon, Progressive, Liberty Mutual

### Targeting signal state (9 signals, all controlled via sidebar dropdowns)
```ts
carMake, locationCtx, batteryCtx, venueCtx, msrpCtx, dwellCtx,
weatherCtx, timeCtx, trafficCtx
```

### `adTagPath` — single source of truth
Computed const shared by `VideoAd` key/src and Developer Tools textarea:
```ts
const adTagPath = `/api/decision?car_make=${carMake}&location=${locationCtx}&battery=${batteryCtx}&venue=${venueCtx}&msrp=${msrpCtx}&dwell=${dwellCtx}&weather=${weatherCtx}&time=${timeCtx}&traffic=${trafficCtx}`;
```

### AdCP terminal
Animated typewriter log — fires new lines when any targeting signal changes.
Color coding: `[VideoEV]` teal, `[OCPP]` amber, `[ENV]` violet, `[WEATHER]` blue, `[BRAND SAFETY]` red, `[CONTEXT]` orange, `[AdCP]` green.

### Developer Tools section
At bottom of sidebar — live VAST tag textarea (read-only, monospace), "Copy URL" button (2s teal confirmation), "View Raw XML" button (opens new tab).

---

## `ImaPlayer.tsx` — VideoAd component

`resolveVideoSrc(src)` — if `src` contains `.mp4`, plays directly. Otherwise fetches as VAST XML and extracts `<MediaFile>` text content.
Renders a plain `<video>` tag with autoplay + muted. Fires `onEnded` callback.
**Note**: `video.js` and `videojs-ima` are in `package.json` but the active component does NOT use them — it's a plain `<video>` element wrapped in a `useEffect`.

---

## Design language

Dark, high-tech, kiosk-first. Consistent with `videoev-demo` visual style.

```
Background:   bg-black, bg-slate-950, bg-slate-900
Surface:      bg-slate-800, bg-slate-900
Text:         text-white, text-slate-300, text-slate-400
Accent:       text-teal-400, text-amber-400
Terminal:     font-mono, text-xs/text-[10px]
```

Custom CSS class `.eyebrow` — small uppercase section label (used from `videoev-demo`'s index.css, but this project may define it inline or via Tailwind).

---

## S3 asset base URL

All video creatives live at:
```
https://videoev.s3.us-east-1.amazonaws.com/
```
Const `S3` defined at the top of both `app/page.tsx` and `app/api/decision/route.ts`.

---

## Database — Neon PostgreSQL

- **Provider**: Neon (serverless Postgres), `us-east-1`
- **Connection**: pooled via `@prisma/adapter-pg` (Prisma 7 driver adapter)
- **DATABASE_URL**: stored in `.env` and in Vercel environment variables (never committed)
- **Schema**: `prisma/schema.prisma` — two models: `Campaign`, `TrackingEvent`
- **Migration**: `prisma/migrations/20260331181735_init/migration.sql` — applied and live

### Prisma 7 notes (important — differs from Prisma 4/5)
- `url` is NOT in `schema.prisma` — Prisma 7 removed it. CLI reads URL from `prisma.config.ts`.
- Runtime client uses `PrismaPg` driver adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- Generated client output: `lib/generated/prisma/` (gitignored). Import from `./generated/prisma/client`.
- `postinstall: "prisma generate"` in `package.json` ensures Vercel regenerates the client on deploy.
- To apply future schema changes: `npx prisma migrate dev --name <description>`
- To browse data: `npx prisma studio` (opens at localhost:5555)

### Campaign model (targetingRules JSON shape)
```json
{
  "bidMultipliers": { "rain": 1.3, "lowBattery": 1.5, "weekend": 1.2 },
  "targetAffinities": ["high_net_worth", "affluent", "luxury_buyer"]
}
```

---

## Auction engine — DB-first waterfall

`/api/decision/route.ts` now has three tiers:
1. **DB campaigns** — `prisma.campaign.findMany({ where: { isActive: true } })`, scored by `scoreAd()`
2. **Static AD_BANK** — 315-ad fallback if DB is empty or unreachable (try/catch wraps DB call)
3. **Hard fallback** — `AD_MAP[carMake]` or Amazon if no eligible ads at all

The static `AD_BANK` import from `lib/ad-generator.ts` is kept as the safety net — the ad server never goes dark.

---

## Campaign Admin Portal — `/admin/campaigns`

Internal managed-service tool. Three-column layout:
- **Left**: Live campaign list fetched from DB, searchable + filterable by sector. Shows tracking event count per campaign.
- **Center**: New Campaign form — Brand, Sector, CPM, Video URL, Conversion Goal, Targeting Multiplier rules (Signal → Condition → Value), Additional Affinities
- **Right**: Syntax-highlighted JSON output of the saved campaign row + campaign inspector panel

Multiplier rule → JSON mapping:
| Signal | Condition | Effect |
|---|---|---|
| Weather | Rainy | Sets `bidMultipliers.rain` |
| Battery Level | < 20% | Sets `bidMultipliers.lowBattery` |
| Day Type | Weekend | Sets `bidMultipliers.weekend` |
| MSRP | > $60k / $100k / $200k | Adds affinity tags |
| Venue | Luxury Retail / Airport / Mall / Hospital | Adds affinity tags |

---

## Deployment

- **Platform**: Vercel (project: `arvin-nundlolls-projects/videoev-adserver`)
- **Production URL**: `ads.videoev.com`
- **Deploy command**: `npx vercel --prod`
- **Build**: Next.js 16 Turbopack, `postinstall` runs `prisma generate` automatically
- **Env var on Vercel**: `DATABASE_URL` set for Production + Preview + Development

---

## Last session summary

**Session: March 2026 — VAST fix, Campaign Admin, Prisma/Neon, Vercel deploy**

- ✅ **VAST 4.0 XML fix**: Stripped Markdown-style `[CACHEBUSTING]`/`[TIMESTAMP]`/`[ERRORCODE]` macros. Replaced with server-side values: `cb = Date.now()`, `ts = new Date().toISOString()`, error code `900`.
- ✅ **Campaign Admin Portal** (`/adserver/admin/campaigns`): Three-column dashboard — campaign list (left), builder form + multiplier rule engine (center), syntax-highlighted JSON output (right).
- ✅ **Prisma 7 + Neon**: Initialized with `@prisma/adapter-pg`. Schema: `Campaign` + `TrackingEvent`. Migration `20260331181735_init` applied to Neon.
- ✅ **DB-first auction**: `/api/decision` fetches active campaigns from Neon, falls back to static `AD_BANK`.
- ✅ **Attribution tracking**: `/api/track` fire-and-forget `TrackingEvent` rows when `campaign_id` present.
- ✅ **Vercel deploy**: `postinstall: prisma generate` in `package.json`. Live at ads.videoev.com.

**Session: April 2026 — Mission Control + Platform Docs (mc.videoev.com)**

- ✅ **Route group refactor**: App restructured into three route groups — `(adserver)`, `(marketing)`, `(data)`
- ✅ **Mission Control** (`/marketing/mission-control` → mc.videoev.com): Master hub with nav cards (Campaign Admin, Client Analytics, CPO Demo Plugin), system vitals strip (status · env · stack · DB), API endpoints panel, infra links, Live Data Explorer (campaigns + events tabs from Neon)
- ✅ **Platform Docs** (`/marketing/mission-control/docs`): Full platform README — TOC sidebar, anchored sections covering: Platform Overview · Architecture · ads/data/demo/mc domains · Infrastructure · End-to-End Data Flow · API Reference
- ✅ **`MissionControl.tsx`**: `"use client"` component; server page masks DATABASE_URL before passing down; shows `vercelEnv` + `vercelRegion` from env
- ✅ **Live Data Explorer**: `DataExplorer` client component fetches `/marketing/api/explorer` — campaigns table + recent events table, refresh button, tab switcher
- ✅ Deployed — mc.videoev.com live ✅

**In-progress / next up:**
- Keep mc.videoev.com links updated as new domains/tools are added
- Platform Docs (`/docs`) should be updated whenever architecture changes
