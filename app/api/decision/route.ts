import { NextRequest, NextResponse } from "next/server";

const S3 = "https://videoev.s3.us-east-1.amazonaws.com";

const AD_MAP: Record<string, { brand: string; s3Url: string; cpm: number }> = {
  // Tech early adopter → Apple iPhone 17 Pro
  tesla:    { brand: "Apple",           s3Url: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`, cpm: 42 },
  // Affluent globe-trotter → Capital One Venture X (Jennifer Garner)
  porsche:  { brand: "Capital One",     s3Url: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`, cpm: 45 },
  // Ultra-luxury celebrity → Maybelline (Miley Cyrus)
  lucid:    { brand: "Maybelline",      s3Url: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`, cpm: 50 },
  // Performance premium European → Oakley Athletic Intelligence
  bmw:      { brand: "Oakley",          s3Url: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`, cpm: 38 },
  // Mainstream American — Ford F-150/Bronco buyer → Nike
  ford:     { brand: "Nike",            s3Url: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, cpm: 34 },
  // Adventure/outdoor — exact Rivian brand match
  rivian:   { brand: "Rivian",          s3Url: `${S3}/Real+Rivian+Adventures+%EF%BD%9C+Saving+Summer.mp4`, cpm: 32 },
  // Wellness-focused luxury → Planet Fitness
  genesis:  { brand: "Planet Fitness",  s3Url: `${S3}/Planet+Fitness+TV+Spot+Finish+Strong+-+iSpot.mp4`, cpm: 22 },
  // American premium icons → Nike (LeBron, Saquon, Scheffler)
  cadillac: { brand: "Nike",            s3Url: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, cpm: 48 },
  // Cinematic sophistication → XFINITY Jurassic Park (Jeff Goldblum)
  jaguar:   { brand: "XFINITY",         s3Url: `${S3}/XFINITY+TV+Spot+Jurassic+Park+Ecosystem+Featuring+Jeff+Goldblum+Sam+Neill+Laura+Dern+-+iSpot.mp4`, cpm: 40 },
  // Modern urban Scandinavian → T-Mobile (Zoe Saldaña, Harvey Guillén)
  polestar: { brand: "T-Mobile",        s3Url: `${S3}/T-Mobile+TV+Spot+Group+Photo+iPhone+17+15-Minute+Switch+Featuring+Harvey+Guilln+Zoe+Saldaa+Druski+-+iSpot.mp4`, cpm: 30 },
  // Family safety, home-focused → Rocket + Redfin
  volvo:    { brand: "Rocket + Redfin", s3Url: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`, cpm: 35 },
};

const FALLBACK = {
  brand: "Amazon",
  s3Url: `${S3}/Amazon+TV+Spot+Train+Robbery+-+iSpot.mp4`,
  cpm: 18,
};

function buildVAST(videoUrl: string, brand: string, cpm: number): string {
  const base = "https://ads.videoev.com/api/track";
  const b = encodeURIComponent(brand);
  // Stable dummy ad ID derived from brand slug (no spaces, lowercase)
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const universalId = `videoev-${brandSlug}-001`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.0" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <Ad id="videoev-${Date.now()}" sequence="1">
    <InLine>
      <AdSystem version="1.0">VideoEV AdCP</AdSystem>
      <AdTitle>${brand} — VideoEV Network</AdTitle>
      <Error><![CDATA[${base}?event=error&code=[ERRORCODE]&brand=${b}]]></Error>
      <Impression id="imp1"><![CDATA[${base}?event=impression&brand=${b}&cpm=${cpm}]]></Impression>
      <Creatives>
        <Creative id="1" sequence="1">
          <UniversalAdId idRegistry="VideoEV">${universalId}</UniversalAdId>
          <Linear>
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[${base}?event=start&brand=${b}]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[${base}?event=q1&brand=${b}]]></Tracking>
              <Tracking event="midpoint"><![CDATA[${base}?event=midpoint&brand=${b}]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[${base}?event=q3&brand=${b}]]></Tracking>
              <Tracking event="complete"><![CDATA[${base}?event=complete&brand=${b}]]></Tracking>
            </TrackingEvents>
            <MediaFiles>
              <MediaFile id="mf1" delivery="progressive" type="video/mp4"
                width="1920" height="1080" scalable="true" maintainAspectRatio="true">
                <![CDATA[${videoUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
      <Extensions>
        <Extension type="VideoEV">
          <Brand>${brand}</Brand>
          <CPM>${cpm}</CPM>
          <Network>VideoEV AdCP</Network>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;
}

export async function GET(req: NextRequest) {
  const carMake = req.nextUrl.searchParams.get("car_make")?.toLowerCase() ?? "";

  const ad = AD_MAP[carMake] ?? (() => {
    console.log(`[AdCP Agent] No direct match for "${carMake}" — running bid auction...`);
    console.log(`[AdCP Agent] Evaluating 12 DSPs... highest bid: $${FALLBACK.cpm} CPM from ${FALLBACK.brand}`);
    return FALLBACK;
  })();

  console.log(`[AdCP Decision] car_make=${carMake} → brand=${ad.brand} CPM=$${ad.cpm}`);

  return new NextResponse(buildVAST(ad.s3Url, ad.brand, ad.cpm), {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
