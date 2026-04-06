import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Only allow requests coming through the mc. subdomain.
  // In production the proxy rewrites mc.videoev.com → /marketing/mission-control,
  // but the original host header is still forwarded by Vercel.
  const host = request.headers.get("host") ?? "";
  const subdomain = host.split(".")[0];
  const isAllowed =
    subdomain === "mc" ||           // mc.videoev.com
    subdomain === "mc" ||           // mc.localhost
    host.startsWith("mc.") ||
    host.startsWith("localhost") || // local dev (any port)
    host.startsWith("127.0.0.1");

  if (!isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [campaigns, events] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id:             true,
          brandName:      true,
          sector:         true,
          baseCpm:        true,
          isActive:       true,
          conversionType: true,
          createdAt:      true,
          _count: { select: { trackingEvents: true } },
        },
      }),
      prisma.trackingEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id:         true,
          campaignId: true,
          sessionId:  true,
          eventType:  true,
          revenue:    true,
          createdAt:  true,
        },
      }),
    ]);

    return NextResponse.json({ campaigns, events });
  } catch (err) {
    console.error("[explorer] DB error:", err);
    return NextResponse.json({ error: "Database unreachable" }, { status: 503 });
  }
}
