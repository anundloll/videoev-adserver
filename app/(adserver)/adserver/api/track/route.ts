import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Minimal 1×1 transparent GIF (43 bytes)
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const PIXEL_HEADERS = {
  "Content-Type":  "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma":        "no-cache",
  "Expires":       "0",
};

// Events that generate billable revenue (CPM model: charged on impression)
const REVENUE_EVENTS = new Set(["impression"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const event      = searchParams.get("event")       ?? "unknown";
  const brand      = searchParams.get("brand")       ?? "unknown";
  const cpm        = searchParams.get("cpm");
  const campaignId = searchParams.get("campaign_id");  // DB UUID, present for DB-sourced campaigns
  const sessionId  = searchParams.get("session_id")  ?? `session-${Date.now()}`;

  const cpmLabel = cpm ? ` — CPM: $${cpm}` : "";
  console.log(`[TRACKING] ${brand} — Event: ${event}${cpmLabel} | session: ${sessionId}`);

  // ── Persist to DB when a campaignId is present ──────────────────────────────
  if (campaignId && campaignId !== "undefined") {
    // Revenue = CPM / 1000 per impression (standard CPM billing)
    const revenue = REVENUE_EVENTS.has(event) && cpm
      ? parseFloat(cpm) / 1000
      : undefined;

    // Fire-and-forget — pixel must return instantly
    Promise.all([
      // 1. Log the tracking event
      prisma.trackingEvent.create({
        data: { campaignId, sessionId, eventType: event, revenue },
      }),
      // 2. On impression: atomically increment spend + plays on the campaign row
      ...(REVENUE_EVENTS.has(event) && revenue != null ? [
        prisma.campaign.update({
          where: { id: campaignId },
          data: {
            spend: { increment: revenue },
            plays: { increment: 1 },
          },
        }),
      ] : []),
    ]).catch((err: unknown) => {
      console.error(`[TRACKING] DB write failed for event "${event}" campaign ${campaignId}:`, err);
    });
  }

  return new NextResponse(PIXEL, { status: 200, headers: PIXEL_HEADERS });
}
