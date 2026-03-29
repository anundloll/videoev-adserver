# VideoEV AdServer — CLAUDE.md
> **ads.videoev.com** · VAST 4.0 ad decision engine + interactive sandbox demo
> Next.js 14 App Router · TypeScript · Tailwind CSS · video.js

This file is Claude's persistent memory for this project. Read it at the start of every session.

---

## GitHub

- **Remote**: `https://github.com/anundloll/videoev-adserver.git` (origin)
- **Branch**: `main` (single branch)
- **Push**: `git push` (tracking configured)

---

## What this product is

VideoEV AdServer (`ads.videoev.com`) is two things in one Next.js app:

1. **Ad decision API** — a VAST 4.0 server that accepts targeting signals and returns ad creatives matched to EV charging context. This is the real product backend.
2. **Interactive sandbox** (`/`) — a kiosk simulation UI where you can tweak all 9 targeting signals via dropdowns and watch the VAST tag update live, serving real video ads.
3. **API documentation** (`/docs`) — full reference page for the decision endpoint.

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
  page.tsx              — interactive sandbox kiosk UI (all UI in one file)
  docs/
    page.tsx            — API reference documentation page
  api/
    decision/
      route.ts          — VAST 4.0 ad decision engine (GET handler)
    track/
      route.ts          — impression/event pixel tracker (returns 1×1 GIF)
components/
  ImaPlayer.tsx         — VideoAd component: resolves VAST XML → plays S3 .mp4
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

#### `GET /api/track` — Pixel tracker
Returns 1×1 transparent GIF. Params: `event`, `brand`, `cpm`.
Events fired from VAST: `impression`, `start`, `q1`, `midpoint`, `q3`, `complete`, `error`.

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

## Last session summary

**Session: March 2026 — Targeting Engine + Developer Tools + Docs page**
- ✅ Developer Tools sidebar section: live VAST tag textarea, Copy URL button, View Raw XML button
- ✅ Added 3 new targeting signals: Weather, Time of Day, Traffic Density (dropdowns + terminal logs)
- ✅ Weather rule (Rule 0): `weather=rainy` → Starbucks at $38 CPM
- ✅ VAST Extensions: added `<Weather>`, `<TimeOfDay>`, `<TrafficDensity>` nodes
- ✅ Created `/docs` page: full API reference with param table, rules waterfall, VAST XML sample
- ✅ Pushed to `anundloll/videoev-adserver` main (commit `6b8026d`)

**Session: March 2026 — Ad Bank + Programmatic Scoring Engine**
- ✅ Created `lib/ad-bank.ts` with 305 typed `Ad` objects across 12 sectors
- ✅ Updated `app/api/decision/route.ts` to import `AD_BANK` and run a weighted scoring engine
- ✅ Migrated old rules waterfall to `calculateScore()` with sector/context/weather/battery multipliers
- ✅ Expanded `DISPLAY_ADS` in `app/page.tsx` to 305+ entries across 23 sectors
- ✅ Added inline SVG QR code placeholders to ~40 display ads (`qr: true` flag)

**In-progress / next up:**
- ⏳ Rewrite `lib/ad-bank.ts` with new deep metadata schema:
  - Replace `attributes: [string,string,string]` + `qrType` with:
    - `bidMultipliers: { rain?, lowBattery?, morning?, evening?, highTraffic?, suburban?, luxury? }`
    - `conversion: { type: 'QR_Discount' | 'Lead_Gen' | 'App_Install'; value: string }`
    - `qrCodeUrl: string` — `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://videoev.com/conversion/[id]`
    - `targetAffinities: string[]` — e.g. `['sustainable', 'high_net_worth', 'commuter', 'homeowner']`
- ⏳ Update `calculateScore()` in `route.ts`:
  - Base Score = 100
  - +50 if `ad.targetAffinities` includes a tag matching `msrp` or `location`
  - Multiply by `ad.bidMultipliers.rain` when `weather === "rainy"`
  - Multiply by `ad.bidMultipliers.lowBattery` when `battery < 20`
- ⏳ Update `buildVAST()` to inject `<QRCodeUrl>`, `<ConversionType>`, `<ConversionValue>` into `<Extension type="VideoEV">`
