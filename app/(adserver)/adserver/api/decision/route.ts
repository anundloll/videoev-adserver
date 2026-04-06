import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AD_BANK } from "@/lib/ad-generator"; // kept as static fallback pool

const S3 = "https://videoev.s3.us-east-1.amazonaws.com";

// ─── Legacy vehicle-targeted creatives (fallback when scoring yields no winner) ─
const AD_MAP: Record<string, { brand: string; s3Url: string; cpm: number }> = {
  tesla:    { brand: "Apple",           s3Url: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`, cpm: 42 },
  porsche:  { brand: "Capital One",     s3Url: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`, cpm: 45 },
  lucid:    { brand: "Maybelline",      s3Url: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`, cpm: 50 },
  bmw:      { brand: "Oakley",          s3Url: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`, cpm: 38 },
  ford:     { brand: "Nike",            s3Url: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, cpm: 34 },
  rivian:   { brand: "Rivian",          s3Url: `${S3}/Real+Rivian+Adventures+%EF%BD%9C+Saving+Summer.mp4`, cpm: 32 },
  genesis:  { brand: "Planet Fitness",  s3Url: `${S3}/Planet+Fitness+TV+Spot+Finish+Strong+-+iSpot.mp4`, cpm: 22 },
  cadillac: { brand: "Nike",            s3Url: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, cpm: 48 },
  jaguar:   { brand: "XFINITY",         s3Url: `${S3}/XFINITY+TV+Spot+Jurassic+Park+Ecosystem+Featuring+Jeff+Goldblum+Sam+Neill+Laura+Dern+-+iSpot.mp4`, cpm: 40 },
  polestar: { brand: "T-Mobile",        s3Url: `${S3}/T-Mobile+TV+Spot+Group+Photo+iPhone+17+15-Minute+Switch+Featuring+Harvey+Guilln+Zoe+Saldaa+Druski+-+iSpot.mp4`, cpm: 30 },
  volvo:    { brand: "Rocket + Redfin", s3Url: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`, cpm: 35 },
};

const FALLBACK = {
  brand: "Amazon",
  s3Url: `${S3}/Amazon+TV+Spot+Train+Robbery+-+iSpot.mp4`,
  cpm: 18,
};

// Brand-safety override for school zones
const SCHOOL_ZONE_AD = {
  brand: "Instacart",
  s3Url: `${S3}/Instacart+Super+Bowl+2026+TV+Spot+Bananas+Featuring+Benson+Boone+Ben+Stiller+-+iSpot.mp4`,
  cpm: 20,
};

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  "https://data.videoev.com",
  "https://ads.videoev.com",
  "https://demo.videoev.com",
]);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin":  allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

// ─── Scoring Context ──────────────────────────────────────────────────────────

type ScoringContext = {
  carMake:  string;
  location: string;
  battery:  string;
  venue:    string;
  msrp:     string;
  dwell:    string;
  weather:  string;
  time:     string;
  traffic:  string;
};

/**
 * Derive a set of affinity tags from incoming request context.
 * These are matched against ad.targetAffinities for +10 pts per hit.
 */
function buildContextTags(ctx: ScoringContext): Set<string> {
  const tags = new Set<string>();

  // MSRP → wealth signals
  if (ctx.msrp === "200k+") {
    tags.add("ultra_luxury");
    tags.add("high_net_worth");
    tags.add("affluent");
    tags.add("high_msrp");
  } else if (ctx.msrp === "120k+") {
    tags.add("high_net_worth");
    tags.add("affluent");
    tags.add("high_msrp");
  } else if (ctx.msrp === "60k+") {
    tags.add("affluent");
  }

  // Location signals
  if (ctx.location === "suburban")  { tags.add("suburban"); tags.add("homeowner"); }
  if (ctx.location === "urban")     { tags.add("urban"); }
  if (ctx.location === "rural")     { tags.add("rural"); }
  if (ctx.location === "highway")   { tags.add("commuter"); }

  // Venue signals
  if (ctx.venue === "airport")        { tags.add("traveler"); tags.add("business_class"); }
  if (ctx.venue === "hospital")       { tags.add("health_conscious"); }
  if (ctx.venue === "luxury_retail")  { tags.add("luxury_buyer"); tags.add("affluent"); tags.add("high_net_worth"); }
  if (ctx.venue === "office")         { tags.add("corporate"); tags.add("b2b"); }
  if (ctx.venue === "mall")           { tags.add("shopper"); tags.add("family"); }

  // Time signals
  if (ctx.time === "morning")  tags.add("morning");
  if (ctx.time === "evening")  tags.add("evening");

  // Weekend detection (server-side)
  const dow = new Date().getDay();
  if (dow === 0 || dow === 6) tags.add("weekend");

  // Traffic
  if (ctx.traffic === "high") tags.add("commuter");

  // Battery urgency — low battery driver is likely hungry/stressed
  if (parseInt(ctx.battery, 10) < 20) {
    tags.add("urgent");
    tags.add("commuter");
  }

  // Car make can map to affinities
  if (ctx.carMake) tags.add(ctx.carMake);

  return tags;
}

// ─── Weighted Scoring Engine ("The Auctioneer") ───────────────────────────────
//
// totalScore starts at baseCpm.
// Context multipliers are applied multiplicatively.
// Each matching affinity tag adds a flat +10 bonus.
// Only ads where baseCpm <= incomingBid enter the auction.
// Winner = highest totalScore among eligible ads.

function scoreAd(
  ad: (typeof AD_BANK)[number],
  ctx: ScoringContext,
  contextTags: Set<string>,
): number {
  let score = ad.baseCpm; // base score = CPM floor

  // ── Contextual multipliers ────────────────────────────────────────────────
  if (ctx.weather === "rainy") {
    score *= ad.bidMultipliers.rain;
  }

  if (parseInt(ctx.battery, 10) < 20) {
    score *= ad.bidMultipliers.lowBattery;
  }

  const isWeekend = contextTags.has("weekend");
  if (isWeekend) {
    score *= ad.bidMultipliers.weekend;
  }

  // ── Affinity matching: +10 per matching tag ────────────────────────────────
  for (const affinity of ad.targetAffinities) {
    if (contextTags.has(affinity)) {
      score += 10;
    }
  }

  return score;
}

// ─── VAST Builder ─────────────────────────────────────────────────────────────

function buildVAST(
  videoUrl: string,
  brand: string,
  cpm: number,
  carMake: string,
  ctx: { venue: string; msrp: string; dwell: string; battery: string; weather: string; time: string; traffic: string },
  conversionType?: string,
  conversionValue?: string,
  qrCodeUrl?: string,
  score?: number,
  campaignId?: string,         // DB UUID — enables atomic spend tracking
): string {
  const base       = "https://ads.videoev.com/api/track";
  const b          = encodeURIComponent(brand);
  const brandSlug  = brand.toUpperCase().replace(/[^A-Z0-9]/g, "-");
  const vehicleSlug = (carMake || "UNKNOWN").toUpperCase();
  const universalId = `VEV-${brandSlug}-${vehicleSlug}-001`;
  const cb         = Date.now().toString();
  const ts         = new Date().toISOString();
  const cid        = campaignId ? `&campaign_id=${encodeURIComponent(campaignId)}` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.0" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <Ad id="videoev-${cb}" sequence="1">
    <InLine>
      <AdSystem version="1.0">VideoEV AdCP</AdSystem>
      <AdTitle>${brand} — VideoEV Network</AdTitle>
      <Pricing model="cpm" currency="USD"><![CDATA[${cpm}]]></Pricing>
      <Error><![CDATA[${base}?event=error&code=900&brand=${b}&cb=${cb}${cid}]]></Error>
      <Impression id="imp1"><![CDATA[${base}?event=impression&brand=${b}&cpm=${cpm}&cb=${cb}&ts=${ts}${cid}]]></Impression>
      <Creatives>
        <Creative id="1" sequence="1">
          <UniversalAdId idRegistry="VideoEV">${universalId}</UniversalAdId>
          <Linear>
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[${base}?event=start&brand=${b}&cb=${cb}&ts=${ts}${cid}]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[${base}?event=q1&brand=${b}&cb=${cb}&ts=${ts}${cid}]]></Tracking>
              <Tracking event="midpoint"><![CDATA[${base}?event=midpoint&brand=${b}&cb=${cb}&ts=${ts}${cid}]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[${base}?event=q3&brand=${b}&cb=${cb}&ts=${ts}${cid}]]></Tracking>
              <Tracking event="complete"><![CDATA[${base}?event=complete&brand=${b}&cpm=${cpm}&cb=${cb}&ts=${ts}${cid}]]></Tracking>
            </TrackingEvents>
            <MediaFiles>
                <MediaFile id="mf1" delivery="progressive" type="video/mp4"
                width="1920" height="1080" scalable="true" maintainAspectRatio="true"
                audioEnabled="true"><![CDATA[${videoUrl}]]></MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
      <Extensions>
        <Extension type="VideoEV">
          <Brand>${brand}</Brand>
          <CPM>${cpm}</CPM>
          <Score>${score != null ? score.toFixed(2) : cpm.toFixed(2)}</Score>
          <Network>VideoEV AdCP</Network>
          <PlacementContext>
            <VenueType>${ctx.venue}</VenueType>
            <MSRPProxy>${ctx.msrp}</MSRPProxy>
            <EstDwellTime>${ctx.dwell} mins</EstDwellTime>
            <Battery>${ctx.battery}</Battery>
            <Weather>${ctx.weather}</Weather>
            <TimeOfDay>${ctx.time}</TimeOfDay>
            <TrafficDensity>${ctx.traffic}</TrafficDensity>
          </PlacementContext>
          <Audio>
            <Enabled>true</Enabled>
            <AutoplayWithSound>true</AutoplayWithSound>
          </Audio>
          <Conversion>
            <Type>${conversionType ?? "Lead_Gen"}</Type>
            <Value><![CDATA[${conversionValue ?? ""}]]></Value>
            <QRCodeUrl><![CDATA[${qrCodeUrl ?? ""}]]></QRCodeUrl>
          </Conversion>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const origin     = req.headers.get("origin");
  const carMake    = searchParams.get("car_make")?.toLowerCase() ?? "";
  const location   = searchParams.get("location")?.toLowerCase() ?? "highway";
  const battery    = searchParams.get("battery") ?? "80";
  const rawVenue   = searchParams.get("venue") ?? "luxury_retail";
  // Normalise legacy/unknown venue values to known scoring values
  const venue      = rawVenue === "ev_station" ? "highway_rest" : rawVenue;
  const msrp       = searchParams.get("msrp") ?? "120k+";
  const dwell      = searchParams.get("dwell") ?? "45";
  const weather    = searchParams.get("weather") ?? "sunny";
  const time       = searchParams.get("time") ?? "morning";
  const traffic    = searchParams.get("traffic") ?? "low";
  const incomingBid = parseFloat(searchParams.get("current_bid") ?? "200");

  const ctx: ScoringContext = { carMake, location, battery, venue, msrp, dwell, weather, time, traffic };
  const vastCtx = { venue, msrp, dwell, battery, weather, time, traffic };

  const responseHeaders = {
    "Content-Type": "text/xml; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders(origin),
  };

  // ── Rule 0: Brand Safety — school zone ───────────────────────────────────
  if (location === "school") {
    console.log(`[AdCP] BRAND SAFETY — school zone. Serving ${SCHOOL_ZONE_AD.brand}.`);
    return new NextResponse(
      buildVAST(SCHOOL_ZONE_AD.s3Url, SCHOOL_ZONE_AD.brand, SCHOOL_ZONE_AD.cpm, carMake, vastCtx),
      { status: 200, headers: responseHeaders },
    );
  }

  // ── The Auctioneer — Weighted Scoring Engine ──────────────────────────────
  const contextTags = buildContextTags(ctx);
  const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://videoev.com/conversion/";

  // ── 1. Try the live database first ───────────────────────────────────────
  let dbEligible: ReturnType<typeof AD_BANK.filter> = [];
  try {
    const dbCampaigns = await prisma.campaign.findMany({
      where: { isActive: true },
    });

    // Shape DB rows into the same ad object the scoring engine expects
    const dbAds = dbCampaigns.map((c: (typeof dbCampaigns)[number]) => {
      const rules = c.targetingRules as {
        bidMultipliers?: { rain: number; lowBattery: number; weekend: number };
        targetAffinities?: string[];
      };
      return {
        id:               c.id,
        brand:            c.brandName,
        sector:           c.sector,
        baseCpm:          c.baseCpm,
        bidMultipliers:   rules.bidMultipliers  ?? { rain: 1.0, lowBattery: 1.0, weekend: 1.0 },
        conversion:       { type: c.conversionType as "QR_Discount" | "Lead_Gen" | "App_Install", value: c.ctaCopy },
        qrCodeUrl:        `${QR_BASE}${c.id}`,
        targetAffinities: rules.targetAffinities ?? [],
        // Prefer Vercel Blob-uploaded creative over the legacy manual URL.
        // creativeUrl is written by the upload handler the moment the file lands;
        // all subdomains (data.*, ads.*, mc.*) read it from the same Neon row.
        videoUrl:         (c as typeof c & { creativeUrl?: string | null }).creativeUrl ?? c.videoUrl,
      };
    });

    dbEligible = dbAds.filter((ad: (typeof dbAds)[number]) => ad.baseCpm <= incomingBid);
  } catch (err) {
    console.warn("[AdCP] DB unavailable — falling through to static AD_BANK:", (err as Error).message);
  }

  // ── 2. Merge DB campaigns with static AD_BANK; DB entries take priority ──
  const staticEligible = AD_BANK.filter(ad => ad.baseCpm <= incomingBid);
  const eligible = dbEligible.length > 0 ? dbEligible : staticEligible;

  if (eligible.length > 0) {
    // Score each eligible ad
    const scored = eligible
      .map(ad => ({ ad, score: scoreAd(ad, ctx, contextTags) }))
      .sort((a, b) => b.score - a.score);

    const { ad: winner, score } = scored[0];

    console.log(
      `[AdCP Auctioneer] Winner: ${winner.brand} (${winner.sector}) ` +
      `score=${score.toFixed(2)} baseCpm=${winner.baseCpm} ` +
      `affinityHits=${winner.targetAffinities.filter(t => contextTags.has(t)).length} ` +
      `car=${carMake} msrp=${msrp} weather=${weather} battery=${battery} bid=${incomingBid}`,
    );

    // Generated ads have placeholder videoUrls — use a real S3 creative for playback
    const realVideoUrl = winner.videoUrl.includes("placeholder_")
      ? (AD_MAP[carMake]?.s3Url ?? FALLBACK.s3Url)
      : winner.videoUrl;

    return new NextResponse(
      buildVAST(
        realVideoUrl,
        winner.brand,
        winner.baseCpm,
        carMake,
        vastCtx,
        winner.conversion.type,
        winner.conversion.value,
        winner.qrCodeUrl,
        score,
        winner.id,            // pass DB UUID so tracking can increment spend
      ),
      { status: 200, headers: responseHeaders },
    );
  }

  // ── 3. Hard fallback: vehicle-based targeting (no eligible ads at all) ────
  const legacyAd = AD_MAP[carMake] ?? (() => {
    console.log(`[AdCP Fallback] No match for "${carMake}" — defaulting to ${FALLBACK.brand}`);
    return FALLBACK;
  })();

  console.log(`[AdCP Fallback] car=${carMake} → brand=${legacyAd.brand} cpm=${legacyAd.cpm}`);

  return new NextResponse(
    buildVAST(legacyAd.s3Url, legacyAd.brand, legacyAd.cpm, carMake, vastCtx),
    { status: 200, headers: responseHeaders },
  );
}
