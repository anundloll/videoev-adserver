"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Telemetry } from "@/components/plugin/VideoEVPlayer";

const VideoEVPlayer = dynamic(
  () => import("@/components/plugin/VideoEVPlayer"),
  { ssr: false },
);

// ─── Demo Scenarios ───────────────────────────────────────────────────────────

const SCENARIOS: Array<{
  label: string;
  desc: string;
  signals: string[];
  telemetry: Partial<Omit<Telemetry, "battery"> & { battery: number }>;
}> = [
  {
    label: "Rainy Day · Low Battery",
    desc: "QSR / comfort intent",
    signals: ["rain multiplier", "low-battery urgency boost"],
    telemetry: { msrp: "40k-80k", battery: 15, weather: "rainy", venue: "highway_rest", traffic: "high" },
  },
  {
    label: "Luxury · Airport Lounge",
    desc: "Ultra-affluent business traveler",
    signals: ["high_net_worth", "traveler", "business_class"],
    telemetry: { msrp: "200k+", battery: 80, weather: "sunny", venue: "airport", time: "morning", carMake: "porsche" },
  },
  {
    label: "Morning Commute · High Traffic",
    desc: "Commuter + morning signal",
    signals: ["commuter", "morning", "high traffic"],
    telemetry: { msrp: "80k-120k", battery: 60, weather: "sunny", venue: "highway_rest", location: "highway", time: "morning", traffic: "high" },
  },
  {
    label: "Weekend · Suburban Mall",
    desc: "Weekend shopper + homeowner",
    signals: ["weekend", "suburban", "homeowner", "shopper"],
    telemetry: { msrp: "40k-80k", battery: 80, weather: "sunny", venue: "mall", location: "suburban" },
  },
  {
    label: "Hospital · Health Signal",
    desc: "Health-conscious intent → pharma / wellness",
    signals: ["health_conscious"],
    telemetry: { msrp: "80k-120k", battery: 70, weather: "cloudy", venue: "hospital", location: "urban" },
  },
  {
    label: "Office Park · B2B",
    desc: "Corporate / B2B audience",
    signals: ["corporate", "b2b"],
    telemetry: { msrp: "80k-120k", battery: 65, weather: "sunny", venue: "office", location: "suburban", time: "morning", traffic: "medium" },
  },
  {
    label: "School Zone",
    desc: "Brand safety override → family-friendly only",
    signals: ["brand_safety"],
    telemetry: { msrp: "40k-80k", battery: 80, weather: "sunny", location: "school", venue: "mall" },
  },
  {
    label: "Luxury Retail · Ultra-HNW",
    desc: "Ultra-luxury tier · max CPM",
    signals: ["ultra_luxury", "high_net_worth", "luxury_buyer"],
    telemetry: { msrp: "200k+", battery: 85, weather: "sunny", venue: "luxury_retail", location: "urban", carMake: "lucid" },
  },
];

// ─── Snippet Generators ───────────────────────────────────────────────────────

function buildTelemetryObj(t: Telemetry): string {
  const lines = [
    `    msrp: "${t.msrp}",`,
    `    battery: ${t.battery},`,
    `    weather: "${t.weather}",`,
    t.venue    && `    venue: "${t.venue}",`,
    t.location && `    location: "${t.location}",`,
    t.time     && `    time: "${t.time}",`,
    t.traffic  && `    traffic: "${t.traffic}",`,
    t.carMake  && `    carMake: "${t.carMake}",`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

function reactSnippet(cpoName: string, accentColor: string, logoUrl: string, stationId: string, t: Telemetry) {
  const logo = logoUrl ? `\n      logoUrl="${logoUrl}"` : "";
  return `// npm install @videoev/player
import VideoEVPlayer from "@videoev/player";

export default function ChargingScreen() {
  return (
    <VideoEVPlayer
      cpoName="${cpoName}"
      accentColor="${accentColor}"${logo}
      stationId="${stationId}"
      telemetry={{
${buildTelemetryObj(t)}
      }}
    />
  );
}`;
}

function htmlSnippet(cpoName: string, accentColor: string, logoUrl: string, stationId: string, t: Telemetry) {
  const logo = logoUrl ? `\n  logo-url="${logoUrl}"` : "";
  const extra = [
    t.venue    && `  data-venue="${t.venue}"`,
    t.location && `  data-location="${t.location}"`,
    t.time     && `  data-time="${t.time}"`,
    t.traffic  && `  data-traffic="${t.traffic}"`,
    t.carMake  && `  data-car-make="${t.carMake}"`,
  ].filter(Boolean).join("\n");
  return `<!-- VideoEV Player — Web Component (zero dependencies) -->
<script
  src="https://ads.videoev.com/plugin/v1/player.js"
  defer
></script>

<videoev-player
  cpo-name="${cpoName}"
  accent-color="${accentColor}"${logo}
  station-id="${stationId}"
  data-msrp="${t.msrp}"
  data-battery="${t.battery}"
  data-weather="${t.weather}"
${extra}
></videoev-player>`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_TELEMETRY: Telemetry = {
  msrp: "120k+", battery: 80, weather: "sunny",
  venue: "luxury_retail", location: "suburban", time: "morning", traffic: "low", carMake: "tesla",
};

export default function CPOSandboxPage() {
  const [cpoName, setCpoName]         = useState("Electrify America");
  const [logoUrl, setLogoUrl]         = useState("");
  const [stationId, setStationId]     = useState("EA-NYC-001");
  const [accentColor, setAccentColor] = useState("#22b4e8");

  const [msrp, setMsrp]         = useState(DEFAULT_TELEMETRY.msrp);
  const [battery, setBattery]   = useState(DEFAULT_TELEMETRY.battery);
  const [weather, setWeather]   = useState(DEFAULT_TELEMETRY.weather);
  const [venue, setVenue]       = useState(DEFAULT_TELEMETRY.venue!);
  const [location, setLocation] = useState(DEFAULT_TELEMETRY.location!);
  const [time, setTime]         = useState(DEFAULT_TELEMETRY.time!);
  const [traffic, setTraffic]   = useState(DEFAULT_TELEMETRY.traffic!);
  const [carMake, setCarMake]   = useState(DEFAULT_TELEMETRY.carMake!);

  const [tab, setTab]     = useState<"react" | "html">("react");
  const [copied, setCopied] = useState(false);

  const telemetry: Telemetry = { msrp, battery, weather, venue, location, time, traffic, carMake };

  const activeSnippet =
    tab === "react"
      ? reactSnippet(cpoName, accentColor, logoUrl, stationId, telemetry)
      : htmlSnippet(cpoName, accentColor, logoUrl, stationId, telemetry);

  const copy = async () => {
    await navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyScenario = (s: (typeof SCENARIOS)[number]) => {
    const t = s.telemetry;
    if (t.msrp     !== undefined) setMsrp(t.msrp);
    if (t.battery  !== undefined) setBattery(t.battery);
    if (t.weather  !== undefined) setWeather(t.weather);
    if (t.venue    !== undefined) setVenue(t.venue);
    if (t.location !== undefined) setLocation(t.location);
    if (t.time     !== undefined) setTime(t.time);
    if (t.traffic  !== undefined) setTraffic(t.traffic);
    if (t.carMake  !== undefined) setCarMake(t.carMake);
  };

  // Active signal pills
  const signals: { label: string; cls: string }[] = [];
  if (battery <= 20)              signals.push({ label: "⚡ Low Battery",    cls: "bg-orange-500/10 text-orange-400" });
  if (weather === "rainy")        signals.push({ label: "🌧 Rainy",           cls: "bg-blue-500/10 text-blue-400" });
  if (msrp === "120k+" || msrp === "200k+") signals.push({ label: "💎 Luxury MSRP", cls: "bg-purple-500/10 text-purple-400" });
  if (venue === "airport")        signals.push({ label: "✈️ Airport",         cls: "bg-sky-500/10 text-sky-400" });
  if (venue === "hospital")       signals.push({ label: "🏥 Hospital",        cls: "bg-green-500/10 text-green-400" });
  if (venue === "office")         signals.push({ label: "🏢 Office",          cls: "bg-indigo-500/10 text-indigo-400" });
  if (location === "school")      signals.push({ label: "🚸 School Zone",     cls: "bg-red-500/10 text-red-400" });
  if (time === "morning" && traffic === "high") signals.push({ label: "🚗 Rush Hour",  cls: "bg-yellow-500/10 text-yellow-400" });

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* ── Top nav ── */}
      <header className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 flex-shrink-0 bg-gray-950">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          VideoEV AdCP
        </Link>
        <span className="text-gray-700 text-sm">/</span>
        <span className="text-gray-400 text-sm">Plugin</span>
        <span className="text-gray-700 text-sm">/</span>
        <span className="text-white text-sm font-medium">CPO Integration Sandbox</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 font-semibold tracking-wide">
            Zero Engineering
          </span>
          <Link href="/docs" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            API Docs →
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Customizer ── */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-gray-800 px-5 py-5 space-y-6">

          {/* Identity */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Identity</div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">CPO Name</span>
                <input type="text" value={cpoName} onChange={(e) => setCpoName(e.target.value)}
                  placeholder="e.g. Electrify America"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors" />
              </label>
              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Logo URL</span>
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors" />
              </label>
              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Station ID</span>
                <input type="text" value={stationId} onChange={(e) => setStationId(e.target.value)}
                  placeholder="e.g. EA-NYC-001"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors font-mono" />
              </label>
              <div>
                <span className="text-gray-400 text-xs mb-1.5 block">Accent Color</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-9 rounded-lg cursor-pointer border border-gray-700 p-0.5 bg-transparent" />
                  <input type="text" value={accentColor} maxLength={7}
                    onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value); }}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-gray-500 transition-colors" />
                </div>
                <div className="mt-2 h-1 rounded-full w-full" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          </section>

          {/* Telemetry */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Live Telemetry</div>
            <div className="space-y-3">

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Vehicle Make</span>
                <select value={carMake} onChange={(e) => setCarMake(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value="tesla">Tesla</option>
                  <option value="porsche">Porsche</option>
                  <option value="lucid">Lucid</option>
                  <option value="bmw">BMW</option>
                  <option value="rivian">Rivian</option>
                  <option value="cadillac">Cadillac</option>
                  <option value="jaguar">Jaguar</option>
                  <option value="volvo">Volvo</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Vehicle MSRP</span>
                <select value={msrp} onChange={(e) => setMsrp(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value="200k+">$200k+ — Ultra Luxury</option>
                  <option value="120k+">$120k+ — Luxury</option>
                  <option value="80k-120k">$80k–$120k — Premium</option>
                  <option value="40k-80k">$40k–$80k — Mass Market</option>
                  <option value="under-40k">Under $40k — Budget</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Battery State</span>
                <select value={battery} onChange={(e) => setBattery(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value={80}>80% — Healthy</option>
                  <option value={40}>40% — Mid</option>
                  <option value={15}>15% — Low Battery</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Weather</span>
                <select value={weather} onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value="sunny">☀️  Clear</option>
                  <option value="rainy">🌧  Rainy</option>
                  <option value="cloudy">☁️  Cloudy</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Venue</span>
                <select value={venue} onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value="luxury_retail">Luxury Retail</option>
                  <option value="airport">Airport</option>
                  <option value="mall">Shopping Mall</option>
                  <option value="office">Office Park</option>
                  <option value="hospital">Hospital</option>
                  <option value="highway_rest">Highway Rest Stop</option>
                  <option value="grocery">Grocery Store</option>
                  <option value="hotel">Hotel</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Location</span>
                <select value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                  <option value="suburban">Suburban</option>
                  <option value="urban">Urban</option>
                  <option value="highway">Highway</option>
                  <option value="rural">Rural</option>
                  <option value="school">School Zone 🚸</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-gray-400 text-xs mb-1.5 block">Time of Day</span>
                  <select value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-gray-400 text-xs mb-1.5 block">Traffic</span>
                  <select value={traffic} onChange={(e) => setTraffic(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

            </div>
          </section>

          {/* Scenario presets */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Demo Scenarios</div>
            <div className="space-y-2">
              {SCENARIOS.map((s) => (
                <button key={s.label} onClick={() => applyScenario(s)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-800 hover:border-gray-600 bg-gray-900 hover:bg-gray-800/80 transition-colors">
                  <div className="text-white text-xs font-medium leading-tight">{s.label}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">{s.desc}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.signals.map(sig => (
                      <span key={sig} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono">
                        {sig}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* ── Right: Preview + Snippet ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

          {/* Live Preview */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="eyebrow text-gray-500">Live Preview</span>
              <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                {signals.map((s) => (
                  <span key={s.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="max-w-[540px]">
              <VideoEVPlayer
                cpoName={cpoName}
                accentColor={accentColor}
                logoUrl={logoUrl || undefined}
                stationId={stationId}
                telemetry={telemetry}
                adDecisionUrl="/api/decision"
              />
            </div>

            <div className="mt-3 max-w-[540px] px-3 py-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="text-gray-500 text-xs leading-relaxed">
                <span className="text-gray-400 font-medium">Signals: </span>
                <span className="text-white font-mono">{carMake}</span>
                {" · "}<span className="text-white font-mono">{msrp}</span>
                {" · "}<span className="text-white font-mono">{battery}%</span>
                {" · "}<span className="text-white font-mono">{weather}</span>
                {" · "}<span className="text-white font-mono">{venue}</span>
                {" · "}<span className="text-white font-mono">{location}</span>
                {" · "}<span className="text-white font-mono">{time}</span>
                {" · "}traffic <span className="text-white font-mono">{traffic}</span>
                {" → "}auctioneer scores all <span className="text-yellow-400">315 ads</span> → highest score wins.
              </div>
            </div>
          </section>

          {/* Integration Snippet */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Integration Snippet</div>

            <div className="max-w-[540px] rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-800">
                {(["react", "html"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                      tab === t ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}>
                    {t === "react" ? "React / Next.js" : "HTML / Script Tag"}
                  </button>
                ))}
                <div className="flex-1" />
                <button onClick={copy}
                  className="text-xs px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-medium">
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="px-5 py-4 text-[12px] font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre">
                {activeSnippet}
              </pre>
            </div>

            <div className="mt-3 max-w-[540px] px-3 py-2.5 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
              <div className="text-yellow-400/80 text-xs leading-relaxed">
                <span className="text-yellow-400 font-semibold">Zero engineering required. </span>
                Paste this snippet into any React CMS or HTML page. VideoEV handles ad decisioning,
                VAST delivery, tracking pixels, and QR conversion — no backend integration needed.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
