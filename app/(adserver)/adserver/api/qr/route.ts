import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/qr?cid=<campaignUUID>&url=<brandUrl>&sid=<sessionId>
//
// Tracking redirect for QR code scans.
// Fires a qr_scan TrackingEvent + increments campaign.plays (not revenue — no CPM charged for scans)
// then 302-redirects the driver's browser to the brand landing page.
//
// The QR image (api.qrserver.com) encodes this URL as its destination.
// This gives us first-party attribution without requiring the driver to grant permissions.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId  = searchParams.get('cid')   ?? ''
  const sessionId   = searchParams.get('sid')   ?? null
  const destination = searchParams.get('url')   ?? 'https://videoev.com'

  // Fire-and-forget — don't block the redirect on DB write
  if (campaignId) {
    prisma.trackingEvent.create({
      data: {
        eventType:  'qr_scan',
        campaignId,
        sessionId,
        revenue:    null,
      },
    }).catch(err => console.error('[qr tracking]', err))
  }

  // Redirect to brand landing page
  return NextResponse.redirect(destination, { status: 302 })
}
