// ─── /data/api/upload — Vercel Blob upload handler ───────────────────────────
// Called by the campaign creation form in data.videoev.com.
//
// Two-phase upload pattern (handles files up to 500 MB without buffering
// through the Next.js server):
//
//   Phase 1 — POST { action: "generateClientToken", ... }
//             Returns a short-lived Vercel Blob client token so the browser
//             can upload directly to blob storage.
//
//   Phase 2 — POST { action: "completeUpload", ... }  (called by Vercel Blob
//             infrastructure after the client upload completes)
//             Receives the final blob URL; we store it on the campaign row
//             if a campaignId was embedded in the token payload.
//
// The resulting public URL (e.g. https://public.blob.vercel-storage.com/...)
// is then written to Campaign.creativeUrl by the caller via PATCH /api/campaigns.

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse }           from "next/server";
import { prisma }                              from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Allowed MIME types — video only for now
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured. Add a Vercel Blob store to this project." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      // Phase 1 — generate a client-side upload token
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Sanitise filename: strip path traversal, force lowercase
        const safe = pathname
          .split("/").pop()!
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .toLowerCase();

        return {
          pathname:              `creatives/${safe}`,
          allowedContentTypes:   ALLOWED_TYPES,
          maximumSizeInBytes:    500 * 1024 * 1024, // 500 MB
          validUntil:            Date.now() + 10 * 60 * 1000, // 10-min window
          // Pass the campaignId through so Phase 2 can update the DB row
          tokenPayload:          JSON.stringify({ campaignId: clientPayload ?? null }),
          addRandomSuffix:       true, // prevents collisions on re-upload
        };
      },

      // Phase 2 — Vercel calls this after the upload completes
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[upload] creative uploaded:", blob.url);

        // If a campaignId was supplied, write creativeUrl to the campaign row
        // immediately so all portals (data.*, ads.*, mc.*) see it at once.
        let campaignId: string | null = null;
        try {
          const parsed = JSON.parse(tokenPayload ?? "{}");
          campaignId   = parsed.campaignId ?? null;
        } catch { /* no-op */ }

        if (campaignId) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data:  { creativeUrl: blob.url },
          });
          console.log("[upload] creativeUrl written to campaign", campaignId);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[upload] handleUpload failed:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
