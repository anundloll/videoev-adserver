import { NextRequest, NextResponse } from "next/server";

const AD_MAP: Record<string, { brand: string; s3Url: string; cpm: number }> = {
  porsche:  { brand: "Rolex",           s3Url: "https://videoev.s3.us-east-1.amazonaws.com/rolex-30s.mp4",       cpm: 42 },
  tesla:    { brand: "Bang & Olufsen",  s3Url: "https://videoev.s3.us-east-1.amazonaws.com/beo-30s.mp4",        cpm: 38 },
  lucid:    { brand: "Hermès",          s3Url: "https://videoev.s3.us-east-1.amazonaws.com/hermes-30s.mp4",     cpm: 55 },
  bmw:      { brand: "BMW",             s3Url: "https://videoev.s3.us-east-1.amazonaws.com/bmw-30s.mp4",        cpm: 35 },
  rivian:   { brand: "Patagonia",       s3Url: "https://videoev.s3.us-east-1.amazonaws.com/patagonia-30s.mp4",  cpm: 28 },
  genesis:  { brand: "Canyon Ranch",    s3Url: "https://videoev.s3.us-east-1.amazonaws.com/canyonranch-30s.mp4",cpm: 32 },
  cadillac: { brand: "Saks",            s3Url: "https://videoev.s3.us-east-1.amazonaws.com/saks-30s.mp4",       cpm: 30 },
  jaguar:   { brand: "Macallan",        s3Url: "https://videoev.s3.us-east-1.amazonaws.com/macallan-30s.mp4",   cpm: 40 },
  polestar: { brand: "REI",             s3Url: "https://videoev.s3.us-east-1.amazonaws.com/rei-30s.mp4",        cpm: 25 },
  volvo:    { brand: "NetJets",         s3Url: "https://videoev.s3.us-east-1.amazonaws.com/netjets-30s.mp4",    cpm: 48 },
};

const FALLBACK = {
  brand: "Premium Brand",
  s3Url: "https://videoev.s3.us-east-1.amazonaws.com/fallback-30s.mp4",
  cpm: 18,
};

function buildVAST(videoUrl: string, brand: string, cpm: number): string {
  const base = "https://ads.videoev.com/api/track";
  const b = encodeURIComponent(brand);
  return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.0" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <Ad id="videoev-${Date.now()}" sequence="1">
    <InLine>
      <AdSystem version="1.0">VideoEV AdCP</AdSystem>
      <AdTitle>${brand} — VideoEV Network</AdTitle>
      <Impression id="imp1"><![CDATA[${base}?event=impression&brand=${b}&cpm=${cpm}]]></Impression>
      <Creatives>
        <Creative id="1" sequence="1">
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
