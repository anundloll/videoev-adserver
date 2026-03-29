import Link from "next/link";

const PARAMS = [
  { name: "car_make",  type: "String",  description: "Vehicle manufacturer (lowercase)",  values: "tesla · porsche · lucid · bmw · ford · rivian · genesis · cadillac · jaguar · polestar · volvo",                                              example: "porsche" },
  { name: "battery",   type: "Integer", description: "State of Charge (0–100)",           values: "100 · 90 · 60 · 40 · 20 · 15 · 5",                                                                                                            example: "15" },
  { name: "location",  type: "String",  description: "Contextual environment",            values: "highway · urban · suburban · shopping · airport · stadium · hospital · office_park · school",                                                  example: "school" },
  { name: "venue",     type: "String",  description: "Physical venue type",               values: "luxury_retail · shopping_mall · grocery · downtown · airport · hotel · office · university · stadium · hospital · highway_rest",               example: "luxury_retail" },
  { name: "msrp",      type: "String",  description: "Vehicle price tier",                values: "200k+ · 120k+ · 80k-120k · 40k-80k · under-40k",                                                                                             example: "120k+" },
  { name: "dwell",     type: "Integer", description: "Estimated charging time (minutes)", values: "10 · 15 · 30 · 45 · 60 · 90",                                                                                                                 example: "45" },
  { name: "weather",   type: "String",  description: "Ambient weather condition",         values: "sunny · rainy · cloudy",                                                                                                                       example: "rainy" },
  { name: "time",      type: "String",  description: "Time of day",                       values: "morning · afternoon · evening",                                                                                                                example: "morning" },
  { name: "traffic",   type: "String",  description: "Traffic density at venue",          values: "low · medium · high",                                                                                                                          example: "high" },
];

const RULES = [
  { priority: "0", signal: "weather=rainy",    outcome: "Starbucks",     cpm: "$38",  note: "Comfort/warmth intent spike" },
  { priority: "1", signal: "location=school",  outcome: "Instacart",     cpm: "$20",  note: "Brand safety — family-friendly only" },
  { priority: "2", signal: "battery=15",       outcome: "Uber Eats",     cpm: "$28",  note: "Low-battery anxiety → QSR intent" },
  { priority: "3", signal: "car_make=*",       outcome: "Vehicle match", cpm: "Var.", note: "11 direct vehicle→brand mappings" },
  { priority: "4", signal: "(no match)",       outcome: "Amazon",        cpm: "$18",  note: "Open auction fallback" },
];

const SAMPLE_REQUEST = `GET https://ads.videoev.com/api/decision
  ?car_make=porsche
  &battery=80
  &location=highway
  &venue=luxury_retail
  &msrp=120k%2B
  &dwell=45
  &weather=sunny
  &time=morning
  &traffic=low`;

const SAMPLE_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.0" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <Ad id="videoev-1711584000000" sequence="1">
    <InLine>
      <AdSystem version="1.0">VideoEV AdCP</AdSystem>
      <AdTitle>Capital One — VideoEV Network</AdTitle>
      <Pricing model="cpm" currency="USD"><![CDATA[45]]></Pricing>
      <Error><![CDATA[https://ads.videoev.com/api/track?event=error&code=[ERRORCODE]&brand=Capital%20One&cb=[CACHEBUSTING]]]></Error>
      <Impression id="imp1"><![CDATA[https://ads.videoev.com/api/track?event=impression&brand=Capital%20One&cpm=45&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Impression>
      <Creatives>
        <Creative id="1" sequence="1">
          <UniversalAdId idRegistry="VideoEV">VEV-CAPITAL-ONE-PORSCHE-001</UniversalAdId>
          <Linear>
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[https://ads.videoev.com/api/track?event=start&brand=Capital%20One&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[https://ads.videoev.com/api/track?event=q1&brand=Capital%20One&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Tracking>
              <Tracking event="midpoint"><![CDATA[https://ads.videoev.com/api/track?event=midpoint&brand=Capital%20One&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[https://ads.videoev.com/api/track?event=q3&brand=Capital%20One&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Tracking>
              <Tracking event="complete"><![CDATA[https://ads.videoev.com/api/track?event=complete&brand=Capital%20One&cb=[CACHEBUSTING]&ts=[TIMESTAMP]]]></Tracking>
            </TrackingEvents>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4"
                width="1920" height="1080">
                <![CDATA[https://videoev.s3.us-east-1.amazonaws.com/...mp4]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
      <Extensions>
        <Extension type="VideoEV">
          <Brand>Capital One</Brand>
          <CPM>45</CPM>
          <Network>VideoEV AdCP</Network>
          <PlacementContext>
            <VenueType>luxury_retail</VenueType>
            <MSRPProxy>120k+</MSRPProxy>
            <EstDwellTime>45 mins</EstDwellTime>
            <Battery>80</Battery>
            <Weather>sunny</Weather>
            <TimeOfDay>morning</TimeOfDay>
            <TrafficDensity>low</TrafficDensity>
          </PlacementContext>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">

      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/videoev-icon-clear.svg" alt="VideoEV" className="w-7 h-7" />
            <span className="font-bold text-white text-lg">Video<span className="text-teal-400">EV</span></span>
            <span className="text-slate-700 text-sm font-medium hidden sm:inline">/ Developer Docs</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Sandbox
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14 space-y-16">

        {/* Hero */}
        <section>
          <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-3">VideoEV AdCP</p>
          <h1 className="text-4xl font-bold text-white mb-4">Developer Documentation</h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            The VideoEV Ad Decision API is a VAST 4.0-compliant endpoint that accepts real-time OCPP telemetry signals
            and returns a targeted video ad creative. All signals are evaluated in a priority waterfall rules engine.
          </p>
        </section>

        {/* Auth */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Authentication</h2>
          <div className="flex items-start gap-4 bg-teal-950/40 border border-teal-800/50 rounded-xl p-5">
            <div className="w-8 h-8 rounded-full bg-teal-400/15 flex items-center justify-center shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div>
              <p className="text-teal-300 font-semibold mb-1">Open Sandbox — No API Key Required</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                This API is currently in open sandbox mode. No authentication headers or API keys are needed to make requests.
                All endpoints are publicly accessible for testing and integration purposes.
                Production deployments will require a bearer token issued per publisher account.
              </p>
            </div>
          </div>
        </section>

        {/* Base URL */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Endpoint</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-2 py-0.5">GET</span>
              <span className="text-xs text-slate-500 font-mono">/api/decision</span>
            </div>
            <div className="px-4 py-4 font-mono text-sm text-teal-300">
              https://ads.videoev.com/api/decision
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-3">Returns a VAST 4.0 XML document. Pass all targeting signals as query parameters.</p>
        </section>

        {/* Parameters table */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Targeting Parameters</h2>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Parameter</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Type</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Description</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Accepted Values</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Example</th>
                </tr>
              </thead>
              <tbody>
                {PARAMS.map((p, i) => (
                  <tr key={p.name} className={`border-b border-slate-800/60 ${i % 2 === 0 ? "bg-slate-950" : "bg-slate-900/30"}`}>
                    <td className="px-5 py-3.5">
                      <code className="text-teal-300 font-mono text-xs bg-teal-950/50 border border-teal-900/50 rounded px-1.5 py-0.5">{p.name}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                        p.type === "Integer"
                          ? "text-violet-300 bg-violet-950/40 border-violet-800/40"
                          : "text-sky-300 bg-sky-950/40 border-sky-800/40"
                      }`}>{p.type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{p.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500 font-mono text-xs leading-relaxed">{p.values}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-slate-400 font-mono text-xs">{p.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rules engine */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Rules Engine</h2>
          <p className="text-slate-500 text-sm mb-5">Signals are evaluated top-down. The first matching rule wins and short-circuits the waterfall.</p>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Priority</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Signal</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Outcome</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">CPM</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {RULES.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-800/60 ${i % 2 === 0 ? "bg-slate-950" : "bg-slate-900/30"}`}>
                    <td className="px-5 py-3.5">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">{r.priority}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-amber-300 font-mono text-xs bg-amber-950/30 border border-amber-800/30 rounded px-1.5 py-0.5">{r.signal}</code>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{r.outcome}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-mono text-xs">{r.cpm}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Code example */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Example Request & Response</h2>
          <div className="space-y-4">

            {/* Request */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
                <span className="text-xs text-slate-600 font-mono">Request</span>
              </div>
              <pre className="px-5 py-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                <span className="text-slate-500">GET </span>{SAMPLE_REQUEST.replace("GET ", "")}
              </pre>
            </div>

            {/* Response */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
                <span className="text-xs text-slate-600 font-mono">Response — 200 OK · text/xml</span>
              </div>
              <pre className="px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {SAMPLE_RESPONSE.split("\n").map((line, i) => {
                  const isTag = line.trim().startsWith("<") && !line.trim().startsWith("<!--");
                  const isComment = line.trim().startsWith("<!--");
                  const isCdata = line.includes("CDATA");
                  return (
                    <span key={i} className={
                      isCdata ? "text-amber-300" :
                      isComment ? "text-slate-600" :
                      isTag ? "text-teal-300" :
                      "text-slate-400"
                    }>
                      {line}{"\n"}
                    </span>
                  );
                })}
              </pre>
            </div>
          </div>
        </section>

        {/* Tracking */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Impression Tracking</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-2 py-0.5">GET</span>
              <span className="text-xs text-slate-500 font-mono">/api/track</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm text-teal-300">
              https://ads.videoev.com/api/track?event=<span className="text-amber-300">[event]</span>&amp;brand=<span className="text-amber-300">[brand]</span>&amp;cpm=<span className="text-amber-300">[cpm]</span>&amp;cb=<span className="text-amber-300">[CACHEBUSTING]</span>&amp;ts=<span className="text-amber-300">[TIMESTAMP]</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["impression", "start", "firstQuartile", "midpoint", "thirdQuartile", "complete"].map(ev => (
              <div key={ev} className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5">
                <code className="text-slate-400 text-xs font-mono">{ev}</code>
              </div>
            ))}
          </div>
        </section>

        {/* CORS */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">CORS Policy</h2>
          <p className="text-slate-500 text-sm mb-5">
            All endpoints support cross-origin requests. The API uses reflective CORS — known VideoEV origins receive
            an explicit <code className="text-teal-300 font-mono text-xs">Access-Control-Allow-Origin</code> echo;
            all other origins receive <code className="text-teal-300 font-mono text-xs">*</code> for VAST player compatibility.
          </p>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Origin</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Access-Control-Allow-Origin</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-semibold">Use case</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { origin: "https://data.videoev.com",  allow: "https://data.videoev.com",  note: "Analytics dashboard" },
                  { origin: "https://ads.videoev.com",   allow: "https://ads.videoev.com",   note: "Sandbox / self" },
                  { origin: "https://demo.videoev.com",  allow: "https://demo.videoev.com",  note: "Demo kiosk" },
                  { origin: "(any other)",               allow: "*",                          note: "Third-party VAST players" },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-slate-800/60 ${i % 2 === 0 ? "bg-slate-950" : "bg-slate-900/30"}`}>
                    <td className="px-5 py-3.5"><code className="text-teal-300 font-mono text-xs">{row.origin}</code></td>
                    <td className="px-5 py-3.5"><code className="text-amber-300 font-mono text-xs">{row.allow}</code></td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 text-xs mt-3">
            OPTIONS preflight requests are handled automatically. Allowed methods: <code className="text-slate-500 font-mono">GET, OPTIONS</code>.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/videoev-icon-clear.svg" alt="VideoEV" className="w-6 h-6 opacity-40" />
            <span className="text-slate-600 text-sm">VideoEV AdCP · Developer API · v1.0</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Sandbox
          </Link>
        </footer>

      </main>
    </div>
  );
}
