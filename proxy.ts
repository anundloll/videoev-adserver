import { NextRequest, NextResponse } from "next/server";

// ─── Subdomain → internal route prefix map ────────────────────────────────────
//
// The middleware rewrites the URL so Next.js's file-system router sees a
// prefixed path, routing each subdomain to its own route group:
//
//   ads.videoev.com/api/decision  →  /adserver/api/decision
//   data.videoev.com/campaigns   →  /data/campaigns
//   videoev.com/                 →  /marketing/
//
// Route groups  (adserver)/, (data)/, (marketing)/  are invisible in URLs —
// they're purely organisational. The internal prefix *inside* the group is
// what the rewrite points to.

const SUBDOMAIN_PREFIX: Record<string, string> = {
  ads:  "adserver",                   // ads.videoev.com  → ad server
  data: "data",                       // data.videoev.com → analytics
  demo: "demo",                       // demo.videoev.com → CPO demo
  mc:   "marketing/mission-control",  // mc.videoev.com   → internal dashboard
  "":   "marketing",                  // videoev.com      → public landing page
  www:  "marketing",                  // www.videoev.com  → public landing page
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract the leftmost subdomain label from a host string.
 *
 *  Production:   ads.videoev.com      → "ads"
 *                videoev.com          → ""
 *  Local dev:    ads.localhost:3004   → "ads"
 *                localhost:3004       → ""
 */
function extractSubdomain(host: string): string {
  // Remove port
  const bare = host.split(":")[0];

  // Local: bare might be "ads.localhost" or just "localhost"
  if (bare === "localhost") return "";
  if (bare.endsWith(".localhost")) return bare.slice(0, -".localhost".length);

  // Production: strip the root domain (last two labels) and return the first
  const labels = bare.split(".");
  if (labels.length <= 2) return "";   // videoev.com
  return labels[0];                    // ads.videoev.com → "ads"
}

// ─── Proxy (Next.js 16 — was "middleware" in earlier versions) ───────────────

export function proxy(request: NextRequest) {
  const url      = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";

  const subdomain = extractSubdomain(hostname);
  const prefix    = SUBDOMAIN_PREFIX[subdomain];

  // Unknown subdomain (e.g. staging.videoev.com not yet mapped) — pass through
  if (prefix === undefined) return NextResponse.next();

  // Rewrite the path:  /foo/bar  →  /<prefix>/foo/bar
  // Root path "/" becomes "/<prefix>" (no trailing slash confusion)
  const incomingPath = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/${prefix}${incomingPath}`;

  return NextResponse.rewrite(url);
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
//
// Skip rewrites for:
//   • Next.js internals  (_next/static, _next/image)
//   • Any file with an extension  (favicon.ico, logo.svg, font.woff2, …)
//
// Everything else — pages, API routes, RSC payloads — goes through the rewrite.

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]{1,6}$).*)",
  ],
};
