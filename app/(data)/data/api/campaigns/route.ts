// ─── /data/api/campaigns (proxied as /api/campaigns on data.videoev.com) ─────
// Brand-scoped campaign CRUD for the Client Workspace.
// SECURITY: brandName is ALWAYS read from BRAND_FILTER — clients cannot
// create or read campaigns belonging to other brands.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Matches the hardcoded session identity in page.tsx.
// Replace with real session lookup (e.g. NextAuth) when auth ships.
const BRAND_FILTER = "Dentsu";

// ─── GET — list this brand's campaigns ───────────────────────────────────────

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      where:   { brandName: BRAND_FILTER },   // ← brand-scoped, always
      orderBy: { createdAt: "desc" },
      select: {
        id:             true,
        brandName:      true,
        sector:         true,
        baseCpm:        true,
        videoUrl:       true,
        conversionType: true,
        ctaCopy:        true,
        targetingRules: true,
        isActive:       true,
        createdAt:      true,
        _count: { select: { trackingEvents: true } },
      },
    });
    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("[data/api/campaigns] GET failed:", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

// ─── POST — create a campaign locked to this brand ───────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    sector:         string;
    baseCpm:        number;
    videoUrl?:      string;
    creativeUrl?:   string;
    conversionType: string;
    ctaCopy:        string;
    targetingRules?: {
      bidMultipliers:  { rain: number; lowBattery: number; weekend: number };
      targetAffinities: string[];
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sector, baseCpm, videoUrl, creativeUrl, conversionType, ctaCopy, targetingRules } = body;

  if (!sector || baseCpm == null) {
    return NextResponse.json({ error: "sector and baseCpm are required" }, { status: 422 });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        brandName:      BRAND_FILTER,     // ← locked — client cannot override
        sector,
        baseCpm:        Number(baseCpm),
        videoUrl:       videoUrl ?? "",
        creativeUrl:    creativeUrl ?? null,  // Vercel Blob URL — preferred by auction engine
        conversionType: conversionType ?? "Lead_Gen",
        ctaCopy:        ctaCopy ?? "",
        targetingRules: targetingRules ?? {
          bidMultipliers:  { rain: 1.0, lowBattery: 1.0, weekend: 1.0 },
          targetAffinities: [],
        },
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[data/api/campaigns] POST failed:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
