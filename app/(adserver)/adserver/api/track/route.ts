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

// Revenue-generating event types — these carry CPM value worth logging
const REVENUE_EVENTS = new Set(["impression"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const event      = searchParams.get("event")       ?? "unknown";
  const brand      = searchParams.get("brand")       ?? "unknown";
  const cpm        = searchParams.get("cpm");
  const campaignId = searchParams.get("campaign_id");  // UUID from DB, if present
  const sessionId  = searchParams.get("session_id")  ?? "unknown-session";

  const cpmLabel = cpm ? ` — CPM: $${cpm}` : "";
  console.log(`[TRACKING] ${brand} — Event: ${event}${cpmLabel} | session: ${sessionId}`);

  // ── Persist to DB when a campaignId is present ──────────────────────────────
  // campaignId is only set for campaigns that came from the database (not legacy
  // static AD_MAP ads), so this write is conditional and never blocks the pixel.
  if (campaignId && campaignId !== "undefined") {
    const revenue = REVENUE_EVENTS.has(event) && cpm ? parseFloat(cpm) : undefined;

    // Fire-and-forget — pixel must return instantly regardless of DB latency
    prisma.trackingEvent
      .create({
        data: {
          campaignId,
          sessionId,
          eventType: event,
          revenue,
        },
      })
      .catch((err: unknown) => {
        console.error(`[TRACKING] Failed to persist event "${event}" for campaign ${campaignId}:`, err);
      });
  }

  return new NextResponse(PIXEL, { status: 200, headers: PIXEL_HEADERS });
}
