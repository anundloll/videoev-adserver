import { NextRequest, NextResponse } from "next/server";

// Minimal 1×1 transparent GIF (43 bytes)
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const event = searchParams.get("event") ?? "unknown";
  const brand = searchParams.get("brand") ?? "unknown";
  const cpm   = searchParams.get("cpm");

  const cpmLabel = cpm ? ` — CPM: $${cpm}` : "";
  console.log(`[TRACKING] ${brand} — Event: ${event}${cpmLabel}`);

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type":  "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma":        "no-cache",
      "Expires":       "0",
    },
  });
}
