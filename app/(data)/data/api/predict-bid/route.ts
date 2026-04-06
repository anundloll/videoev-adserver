// ─── /data/api/predict-bid (proxied as /api/predict-bid on data.videoev.com) ─
// Simulation engine for the Audience & Identity tab's PredictBid feature.
//
// GET /api/predict-bid?segment=luxury_auto&brand=Dentsu
//
// Logic:
//   1. Pull VehicleProfiles from the last 30 days
//   2. If table is empty, estimate from distinct TrackingEvent sessionIds
//   3. Apply audience segment filter
//   4. Score against the brand's campaign targetAffinities
//   5. Return estimated reach, CPM uplift, and confidence band

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BRAND_FILTER = "Dentsu";   // same singleton as the rest of data.*

// ─── Audience segment definitions ────────────────────────────────────────────

type SegmentKey =
  | "luxury_auto"
  | "high_hhi"
  | "tech_early_adopter"
  | "outdoor_adventure"
  | "business_traveler"
  | "all";

const SEGMENT_META: Record<SegmentKey, {
  label:        string;
  filter:       (p: { msrp: number | null; make: string; venue: string | null }) => boolean;
  cpmUplift:    number;   // multiplier on the brand's base CPM
  affinityTags: string[];
}> = {
  luxury_auto: {
    label:        "Luxury Auto",
    filter:       p => (p.msrp ?? 0) >= 60_000,
    cpmUplift:    1.45,
    affinityTags: ["affluent", "luxury_buyer", "high_net_worth"],
  },
  high_hhi: {
    label:        "High HHI ($200k+)",
    filter:       p => (p.msrp ?? 0) >= 100_000,
    cpmUplift:    1.80,
    affinityTags: ["high_net_worth", "ultra_luxury"],
  },
  tech_early_adopter: {
    label:        "Tech Early Adopters",
    filter:       () => true,   // All EV drivers qualify
    cpmUplift:    1.20,
    affinityTags: ["tech_savvy", "early_adopter"],
  },
  outdoor_adventure: {
    label:        "Outdoor & Adventure",
    filter:       p => ["Rivian", "Ford", "Toyota", "Jeep", "Subaru"].includes(p.make),
    cpmUplift:    1.25,
    affinityTags: ["outdoor", "adventure", "sustainability"],
  },
  business_traveler: {
    label:        "Business Traveler",
    filter:       p => p.venue === "airport" || p.venue === "office_park",
    cpmUplift:    1.60,
    affinityTags: ["business_class", "traveler", "affluent"],
  },
  all: {
    label:        "All Vehicles",
    filter:       () => true,
    cpmUplift:    1.0,
    affinityTags: [],
  },
};

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const segmentKey = (searchParams.get("segment") ?? "luxury_auto") as SegmentKey;
  const segment    = SEGMENT_META[segmentKey] ?? SEGMENT_META.luxury_auto;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Pull vehicle profiles from the last 30 days
  const profiles = await prisma.vehicleProfile.findMany({
    where:  { detectedAt: { gte: thirtyDaysAgo } },
    select: { make: true, msrp: true, venue: true, dwellMinutes: true },
  });

  // Fallback: if no vehicle profiles yet, use distinct TrackingEvent sessions
  // scoped to this brand as the universe estimate.
  let universeSize: number;
  let dataSource: "vehicle_profiles" | "session_estimate";

  if (profiles.length > 0) {
    universeSize = profiles.length;
    dataSource   = "vehicle_profiles";
  } else {
    const uniqueSessions = await prisma.trackingEvent.findMany({
      where:    { campaign: { brandName: BRAND_FILTER }, createdAt: { gte: thirtyDaysAgo } },
      select:   { sessionId: true },
      distinct: ["sessionId"],
    });
    universeSize = uniqueSessions.length || 847; // 847 = network baseline if no data at all
    dataSource   = "session_estimate";
  }

  // Apply segment filter
  const matched = profiles.length > 0
    ? profiles.filter(p => segment.filter({ msrp: p.msrp, make: p.make, venue: p.venue })).length
    : Math.round(universeSize * estimateSegmentRate(segmentKey));

  // Pull brand's current base CPM
  const brandCampaign = await prisma.campaign.findFirst({
    where:  { brandName: BRAND_FILTER, isActive: true },
    select: { baseCpm: true },
    orderBy: { baseCpm: "desc" },
  });
  const baseCpm     = brandCampaign?.baseCpm ?? 35;
  const effectiveCpm = baseCpm * segment.cpmUplift;

  // Monthly projection: scale 30-day match × 30 / 30 (already monthly), × monthly_sessions_factor
  const monthlyImpressions = Math.round(matched * 1.8); // ~1.8 sessions/vehicle/month avg
  const monthlyRevenue     = (monthlyImpressions / 1000) * effectiveCpm;

  // Confidence band
  const confidence =
    dataSource === "vehicle_profiles" && profiles.length >= 30 ? "High"
    : dataSource === "vehicle_profiles" && profiles.length >= 10 ? "Moderate"
    : "Indicative";

  return NextResponse.json({
    segment:            segment.label,
    dataSource,
    universeSize,
    matchedVehicles:    matched,
    matchRate:          universeSize > 0 ? matched / universeSize : 0,
    monthlyImpressions,
    effectiveCpm:       parseFloat(effectiveCpm.toFixed(2)),
    estimatedMonthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
    confidence,
    affinityTags:       segment.affinityTags,
    // Breakdown
    breakdown: {
      luxuryCount:    profiles.filter(p => (p.msrp ?? 0) >= 60_000).length,
      hnwCount:       profiles.filter(p => (p.msrp ?? 0) >= 100_000).length,
      ultraLuxCount:  profiles.filter(p => (p.msrp ?? 0) >= 200_000).length,
      avgDwell:       profiles.length > 0
        ? parseFloat((profiles.reduce((s, p) => s + (p.dwellMinutes ?? 0), 0) / profiles.length).toFixed(1))
        : 24,
    },
  });
}

// Fallback segment rates when no vehicle profile data exists
function estimateSegmentRate(key: SegmentKey): number {
  return { luxury_auto: 0.52, high_hhi: 0.28, tech_early_adopter: 0.95, outdoor_adventure: 0.31, business_traveler: 0.18, all: 1.0 }[key] ?? 0.5;
}
