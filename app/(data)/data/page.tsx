// ─── data.videoev.com — Server Component ─────────────────────────────────────
// All Prisma queries run here on the server. Serialisable data is passed to
// <ClientWorkspace> for rendering. Uses the shared @/lib/prisma singleton —
// the same connection pool as ads.videoev.com — so impressions recorded by
// the Ad Server are immediately visible here without any cache lag.
//
// DATA ISOLATION: Every query that touches Campaign or TrackingEvent rows
// filters by  where: { brandName: BRAND_FILTER }  or
//             where: { campaign: { brandName: BRAND_FILTER } }
// so no cross-brand data can leak to this workspace.

import { prisma } from "@/lib/prisma";
import ClientWorkspace, { type WorkspaceData, type PulseDay } from "./DataDashboard";

export const dynamic = "force-dynamic";   // no ISR — always fresh

// ─── Session identity (replace with NextAuth / cookie lookup when auth ships) ─
const BRAND_FILTER = "Dentsu";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPulse(events: { createdAt: Date }[]): PulseDay[] {
  const map: Record<string, number> = {};
  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10);
    map[key]  = (map[key] ?? 0) + 1;
  }
  const days: PulseDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: map[key] ?? 0 });
  }
  return days;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DataDashboardPage() {
  const fiveMinAgo    = new Date(Date.now() -  5 * 60 * 1_000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);

  // All queries run in parallel — zero waterfalls
  const [
    impressionCount,
    qrScanCount,
    completeCount,
    spendAgg,
    recentEvent,
    lastEventAny,
    pulseEvents,
    uniqueSessionRows,
    vehicleProfiles,
    campaigns,
  ] = await Promise.all([

    // ── Plays (impressions) ─────────────────────────────────────────────────
    prisma.trackingEvent.count({
      where: { campaign: { brandName: BRAND_FILTER }, eventType: "impression" },
    }),

    // ── QR scans ────────────────────────────────────────────────────────────
    prisma.trackingEvent.count({
      where: { campaign: { brandName: BRAND_FILTER }, eventType: "qr_scan" },
    }),

    // ── Completions (for rate) ──────────────────────────────────────────────
    prisma.trackingEvent.count({
      where: { campaign: { brandName: BRAND_FILTER }, eventType: "complete" },
    }),

    // ── Total spend: SUM(revenue) on impressions ÷ 1000 = CPM → $ ──────────
    prisma.trackingEvent.aggregate({
      where: { campaign: { brandName: BRAND_FILTER }, eventType: "impression" },
      _sum:  { revenue: true },
    }),

    // ── Live indicator: any event in the last 5 minutes ─────────────────────
    // This uses the SAME @/lib/prisma instance as the Ad Server, so a fresh
    // impression fires here within milliseconds — no cache or polling gap.
    prisma.trackingEvent.findFirst({
      where:   { campaign: { brandName: BRAND_FILTER }, createdAt: { gte: fiveMinAgo } },
      orderBy: { createdAt: "desc" },
      select:  { createdAt: true },
    }),

    // ── Most recent event ever (for header timestamp) ────────────────────────
    prisma.trackingEvent.findFirst({
      where:   { campaign: { brandName: BRAND_FILTER } },
      orderBy: { createdAt: "desc" },
      select:  { createdAt: true },
    }),

    // ── 30-day impression events (chart) ─────────────────────────────────────
    prisma.trackingEvent.findMany({
      where:  { campaign: { brandName: BRAND_FILTER }, eventType: "impression", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),

    // ── Unique vehicles: distinct sessionIds across all brand events ─────────
    prisma.trackingEvent.findMany({
      where:    { campaign: { brandName: BRAND_FILTER } },
      select:   { sessionId: true },
      distinct: ["sessionId"],
    }),

    // ── Vehicle Intelligence: profiles from OCPP ingest ─────────────────────
    prisma.vehicleProfile.findMany({
      select: { make: true, msrp: true, dwellMinutes: true, venue: true },
    }),

    // ── Campaign list for Campaigns tab (brand-scoped) ───────────────────────
    prisma.campaign.findMany({
      where:   { brandName: BRAND_FILTER },
      orderBy: { createdAt: "desc" },
      select: {
        id:             true,
        brandName:      true,
        sector:         true,
        baseCpm:        true,
        isActive:       true,
        conversionType: true,
        ctaCopy:        true,
        createdAt:      true,
        _count: { select: { trackingEvents: true } },
      },
    }),
  ]);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const totalSpend     = (spendAgg._sum.revenue ?? 0) / 1000;
  const completionRate = impressionCount > 0 ? (completeCount / impressionCount) * 100 : 0;
  const pulse          = buildPulse(pulseEvents);
  const uniqueVehicles = uniqueSessionRows.length;

  // Avg dwell: from hardware-ingested profiles if available, else EV industry avg
  const avgDwellMinutes =
    vehicleProfiles.length > 0
      ? parseFloat(
          (vehicleProfiles.reduce((s, p) => s + (p.dwellMinutes ?? 24), 0) / vehicleProfiles.length).toFixed(1)
        )
      : 24; // AFDC average for Level 2 charging dwell

  // Vehicle make breakdown (sorted by count desc)
  const makeMap: Record<string, number> = {};
  for (const p of vehicleProfiles) makeMap[p.make] = (makeMap[p.make] ?? 0) + 1;
  const vehicleMakes = Object.entries(makeMap)
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // MSRP tier breakdown
  const msrpTiers = [
    { tier: "Accessible",    label: "< $40k",       count: vehicleProfiles.filter(p => (p.msrp ?? 0) <  40_000).length },
    { tier: "Affluent",      label: "$40k – $80k",  count: vehicleProfiles.filter(p => (p.msrp ?? 0) >= 40_000 && (p.msrp ?? 0) < 80_000).length },
    { tier: "High Net Worth",label: "$80k – $150k", count: vehicleProfiles.filter(p => (p.msrp ?? 0) >= 80_000 && (p.msrp ?? 0) < 150_000).length },
    { tier: "Ultra Luxury",  label: "$150k+",       count: vehicleProfiles.filter(p => (p.msrp ?? 0) >= 150_000).length },
  ];

  // Serialise campaigns (Dates → strings for client prop)
  const campaignRows = campaigns.map(c => ({
    id:             c.id,
    brandName:      c.brandName,
    sector:         c.sector,
    baseCpm:        c.baseCpm,
    isActive:       c.isActive,
    conversionType: c.conversionType,
    ctaCopy:        c.ctaCopy,
    createdAt:      c.createdAt.toISOString(),
    eventCount:     c._count.trackingEvents,
  }));

  const data: WorkspaceData = {
    brand:           BRAND_FILTER,
    isLive:          !!recentEvent,
    lastEventAt:     lastEventAny?.createdAt.toISOString() ?? null,
    totalPlays:      impressionCount,
    qrScans:         qrScanCount,
    totalSpend,
    completionRate,
    pulse,
    lastRefreshed:   new Date().toISOString(),
    uniqueVehicles,
    avgDwellMinutes,
    vehicleMakes,
    msrpTiers,
    hasVehicleData:  vehicleProfiles.length > 0,
    campaigns:       campaignRows,
  };

  return <ClientWorkspace data={data} />;
}
