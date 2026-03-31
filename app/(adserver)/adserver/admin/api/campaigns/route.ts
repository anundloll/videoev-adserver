import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET /admin/api/campaigns ─────────────────────────────────────────────────
// Returns all campaigns ordered by creation date (newest first).

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
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
        _count:         { select: { trackingEvents: true } },
      },
    });

    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("[Admin API] GET /campaigns failed:", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

// ─── POST /admin/api/campaigns ────────────────────────────────────────────────
// Accepts the campaign form payload and inserts a new row.

export interface CampaignPayload {
  brandName:      string;
  sector:         string;
  baseCpm:        number;
  videoUrl:       string;
  conversionType: string;
  ctaCopy:        string;
  targetingRules: {
    bidMultipliers: { rain: number; lowBattery: number; weekend: number };
    targetAffinities: string[];
  };
}

export async function POST(req: NextRequest) {
  let body: CampaignPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brandName, sector, baseCpm, videoUrl, conversionType, ctaCopy, targetingRules } = body;

  if (!brandName?.trim() || !sector || baseCpm == null) {
    return NextResponse.json({ error: "brandName, sector, and baseCpm are required" }, { status: 422 });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        brandName:      brandName.trim(),
        sector,
        baseCpm:        Number(baseCpm),
        videoUrl:       videoUrl ?? "",
        conversionType: conversionType ?? "Lead_Gen",
        ctaCopy:        ctaCopy ?? "",
        targetingRules: targetingRules ?? { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.0 }, targetAffinities: [] },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[Admin API] POST /campaigns failed:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
