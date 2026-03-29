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

const SCENARIOS = [
  {
    label: "Rainy Day · Low Battery",
    desc: "QSR / comfort intent → boosts rain + low-battery multipliers",
    msrp: "40k-80k",
    battery: 15,
    weather: "rainy",
  },
  {
    label: "Luxury · Clear Day",
    desc: "High-net-worth affluent signal → premium tier ads win",
    msrp: "120k+",
    battery: 80,
    weather: "sunny",
  },
  {
    label: "Mass Market · Clear Day",
    desc: "General audience → open auction fallback",
    msrp: "40k-80k",
    battery: 80,
    weather: "sunny",
  },
] as const;

// ─── Snippet Generators ───────────────────────────────────────────────────────

function reactSnippet(
  cpoName: string,
  accentColor: string,
  logoUrl: string,
  stationId: string,
  msrp: string,
  battery: number,
  weather: string,
) {
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
        msrp: "${msrp}",
        battery: ${battery},
        weather: "${weather}",
      }}
    />
  );
}`;
}

function htmlSnippet(
  cpoName: string,
  accentColor: string,
  logoUrl: string,
  stationId: string,
  msrp: string,
  battery: number,
  weather: string,
) {
  const logo = logoUrl ? `\n  logo-url="${logoUrl}"` : "";
  return `<!-- VideoEV Player — Web Component (zero dependencies) -->
<script
  src="https://ads.videoev.com/plugin/v1/player.js"
  defer
></script>

<videoev-player
  cpo-name="${cpoName}"
  accent-color="${accentColor}"${logo}
  station-id="${stationId}"
  data-msrp="${msrp}"
  data-battery="${battery}"
  data-weather="${weather}"
></videoev-player>`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CPOSandboxPage() {
  // Identity
  const [cpoName, setCpoName]     = useState("Electrify America");
  const [logoUrl, setLogoUrl]     = useState("");
  const [stationId, setStationId] = useState("EA-NYC-001");
  const [accentColor, setAccentColor] = useState("#22b4e8");

  // Telemetry
  const [msrp, setMsrp]       = useState("120k+");
  const [battery, setBattery] = useState(80);
  const [weather, setWeather] = useState("sunny");

  // Snippet
  const [tab, setTab]     = useState<"react" | "html">("react");
  const [copied, setCopied] = useState(false);

  const telemetry: Telemetry = { msrp, battery, weather };

  const activeSnippet =
    tab === "react"
      ? reactSnippet(cpoName, accentColor, logoUrl, stationId, msrp, battery, weather)
      : htmlSnippet(cpoName, accentColor, logoUrl, stationId, msrp, battery, weather);

  const copy = async () => {
    await navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Active signal pills
  const signals: { label: string; cls: string }[] = [];
  if (battery <= 20)       signals.push({ label: "⚡ Low Battery", cls: "bg-orange-500/10 text-orange-400" });
  if (weather === "rainy") signals.push({ label: "🌧 Rainy",       cls: "bg-blue-500/10 text-blue-400" });
  if (msrp === "120k+")    signals.push({ label: "💎 Luxury MSRP", cls: "bg-purple-500/10 text-purple-400" });

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
          <Link
            href="/docs"
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
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
                <input
                  type="text"
                  value={cpoName}
                  onChange={(e) => setCpoName(e.target.value)}
                  placeholder="e.g. Electrify America"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Logo URL</span>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Station ID</span>
                <input
                  type="text"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  placeholder="e.g. EA-NYC-001"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors font-mono"
                />
              </label>

              <div>
                <span className="text-gray-400 text-xs mb-1.5 block">Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-9 rounded-lg cursor-pointer border border-gray-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                        setAccentColor(e.target.value);
                      }
                    }}
                    maxLength={7}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
                {/* Live color preview swatch */}
                <div
                  className="mt-2 h-1 rounded-full w-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </section>

          {/* Telemetry */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Live Telemetry</div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Vehicle MSRP</span>
                <select
                  value={msrp}
                  onChange={(e) => setMsrp(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="120k+">$120k+ — Luxury</option>
                  <option value="40k-80k">$40k–$80k — Mass Market</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Battery State</span>
                <select
                  value={battery}
                  onChange={(e) => setBattery(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  <option value={80}>80% — Healthy</option>
                  <option value={15}>15% — Low Battery</option>
                </select>
              </label>

              <label className="block">
                <span className="text-gray-400 text-xs mb-1.5 block">Weather</span>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="sunny">☀️  Clear</option>
                  <option value="rainy">🌧  Rainy</option>
                </select>
              </label>
            </div>
          </section>

          {/* Scenario presets */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Demo Scenarios</div>
            <div className="space-y-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setMsrp(s.msrp);
                    setBattery(s.battery);
                    setWeather(s.weather);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-800 hover:border-gray-600 bg-gray-900 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="text-white text-xs font-medium leading-tight">{s.label}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5 leading-snug">{s.desc}</div>
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

            {/* Targeting explanation */}
            <div className="mt-3 max-w-[540px] px-3 py-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
              <div className="text-gray-500 text-xs leading-relaxed">
                <span className="text-gray-400 font-medium">How this ad was selected: </span>
                MSRP <span className="text-white font-mono">{msrp}</span>
                {" · "}battery <span className="text-white font-mono">{battery}%</span>
                {" · "}weather <span className="text-white font-mono">{weather}</span>
                {" → "}context tags injected → auctioneer scores all{" "}
                <span className="text-yellow-400">315 ads</span> → highest CPM × multipliers wins.
              </div>
            </div>
          </section>

          {/* Integration Snippet */}
          <section>
            <div className="eyebrow text-gray-500 mb-3">Integration Snippet</div>

            <div className="max-w-[540px] rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              {/* Tabs + Copy */}
              <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-800">
                {(["react", "html"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                      tab === t
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t === "react" ? "React / Next.js" : "HTML / Script Tag"}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={copy}
                  className="text-xs px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              {/* Code block */}
              <pre className="px-5 py-4 text-[12px] font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre">
                {activeSnippet}
              </pre>
            </div>

            {/* Zero-engineering callout */}
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
