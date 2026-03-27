"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ImaPlayer = dynamic(() => import("@/components/ImaPlayer"), { ssr: false });

const VEHICLES = [
  { make: "Tesla",    label: "Tesla Model S",   battery: 23, target: 80,  duration: 45, rate: 0.64 },
  { make: "Porsche",  label: "Porsche Taycan",  battery: 41, target: 90,  duration: 38, rate: 0.64 },
  { make: "Rivian",   label: "Rivian R1T",      battery: 12, target: 100, duration: 62, rate: 0.64 },
  { make: "BMW",      label: "BMW iX",          battery: 67, target: 85,  duration: 18, rate: 0.64 },
  { make: "Lucid",    label: "Lucid Air",       battery: 55, target: 95,  duration: 28, rate: 0.64 },
  { make: "Volvo",    label: "Volvo EX90",      battery: 30, target: 90,  duration: 52, rate: 0.64 },
  { make: "Jaguar",   label: "Jaguar I-Pace",   battery: 48, target: 80,  duration: 25, rate: 0.64 },
  { make: "Cadillac", label: "Cadillac Lyriq",  battery: 35, target: 95,  duration: 40, rate: 0.64 },
];

const AGENT_LOG_TEMPLATES = [
  (make: string) => `[AdCP] Vehicle detected: ${make}`,
  () => "[AdCP] Fetching audience profile...",
  () => "[AdCP] Profile: high-income, tech-forward",
  () => "[AdCP] Running auction across 14 DSPs...",
  (make: string, brand: string, cpm: number) => `[AdCP] Winning bid: $${cpm}.00 CPM — ${brand}`,
  () => "[AdCP] Creative fetched from S3",
  () => "[AdCP] VAST 4.0 compiled — serving",
];

const AD_CPM: Record<string, { brand: string; cpm: number }> = {
  tesla: { brand: "Bang & Olufsen", cpm: 38 },
  porsche: { brand: "Rolex", cpm: 42 },
  rivian: { brand: "Patagonia", cpm: 28 },
  bmw: { brand: "BMW", cpm: 35 },
  lucid: { brand: "Hermès", cpm: 55 },
  volvo: { brand: "NetJets", cpm: 48 },
  jaguar: { brand: "Macallan", cpm: 40 },
  cadillac: { brand: "Saks", cpm: 30 },
};

export default function KioskPage() {
  const [vehicle, setVehicle] = useState(VEHICLES[0]);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const adInfo = AD_CPM[vehicle.make.toLowerCase()] ?? { brand: "Premium Brand", cpm: 18 };

  const batteryPct = Math.min(
    vehicle.target,
    vehicle.battery + Math.floor((elapsed / 60) * ((vehicle.target - vehicle.battery) / vehicle.duration))
  );
  const remaining = Math.max(0, vehicle.duration - Math.floor(elapsed / 60));
  const kwhDelivered = Math.max(0, ((batteryPct - vehicle.battery) * 0.82)).toFixed(1);
  const cost = (parseFloat(kwhDelivered) * vehicle.rate).toFixed(2);

  const batteryColor =
    batteryPct < 20 ? "bg-orange-400" :
    batteryPct > 80 ? "bg-emerald-400" :
    "bg-teal-400";

  const batteryTextColor =
    batteryPct < 20 ? "text-orange-400" :
    batteryPct > 80 ? "text-emerald-400" :
    "text-teal-400";

  const statusDotClass = remaining > 5
    ? "bg-red-500 animate-pulse"
    : "bg-emerald-400 animate-pulse";

  const statusText =
    batteryPct >= vehicle.target ? `Almost complete · ${batteryPct}% charged` :
    elapsed < 5 ? "Charging session started" :
    "Charging in progress...";

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Agent log drip — resets on vehicle change
  useEffect(() => {
    setLogs([]);
    setElapsed(0);
    const lines = AGENT_LOG_TEMPLATES.map((fn, i) =>
      i === 0 ? fn(vehicle.make, "", 0) :
      i === 4 ? fn("", adInfo.brand, adInfo.cpm) :
      fn("", "", 0)
    );
    let i = 0;
    const id = setInterval(() => {
      if (i < lines.length) {
        setLogs(prev => [...prev, lines[i++]]);
        setTimeout(() => {
          logRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
        }, 50);
      } else {
        clearInterval(id);
      }
    }, 550);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.make]);

  const adTagUrl = `/api/decision?car_make=${vehicle.make}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900">

      {/* ── Main row ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left sidebar ── */}
        <aside className="w-72 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col p-5 overflow-hidden">

          {/* Vehicle selector */}
          <div className="mb-5">
            <p className="eyebrow text-slate-500 mb-1.5">Vehicle</p>
            <select
              value={vehicle.make}
              onChange={e => setVehicle(VEHICLES.find(v => v.make === e.target.value) ?? VEHICLES[0])}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {VEHICLES.map(v => (
                <option key={v.make} value={v.make}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 mb-5" />

          {/* Charging stats */}
          <p className="eyebrow text-slate-500 mb-4">
            {elapsed < 5 ? "Session Started" : "Charging Status"}
          </p>

          {/* Battery */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-slate-400 text-xs">🔋</span>
              <span className="eyebrow text-slate-400">
                {elapsed < 5 ? "Current Battery" : "Battery Level"}
              </span>
            </div>
            <div className={`text-3xl font-bold num ${batteryTextColor}`}>{batteryPct}%</div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${batteryColor}`}
                style={{ width: `${batteryPct}%` }}
              />
            </div>
          </div>

          {/* Power */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-slate-400 text-xs">⚡</span>
              <span className="eyebrow text-slate-400">Power Delivered</span>
            </div>
            <div className="text-3xl font-bold num text-white">{kwhDelivered} kWh</div>
          </div>

          {/* Time */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-slate-400 text-xs">🕐</span>
              <span className="eyebrow text-slate-400">
                {elapsed < 5 ? "Est. Duration" : "Time Remaining"}
              </span>
            </div>
            <div className="text-3xl font-bold num text-white">{remaining} min</div>
          </div>

          {/* Cost */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-slate-400 text-xs">$</span>
              <span className="eyebrow text-slate-400">
                {elapsed < 5 ? "Rate" : "Session Cost"}
              </span>
            </div>
            <div className="text-3xl font-bold num text-white">
              {elapsed < 5 ? `$${vehicle.rate}` : `$${cost}`}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">
              {elapsed < 5 ? "per kWh" : `$${vehicle.rate}/kWh`}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-0" />

          {/* AdCP terminal */}
          <div className="mt-3">
            <p className="eyebrow text-slate-500 mb-1.5">AdCP Agent Logs</p>
            <div
              ref={logRef}
              className="bg-black rounded-lg p-2.5 h-32 overflow-y-auto font-mono text-xs text-emerald-400 space-y-0.5"
            >
              {logs.map((l, i) => <div key={i}>{l}</div>)}
              {logs.length < AGENT_LOG_TEMPLATES.length && (
                <span className="animate-pulse">▊</span>
              )}
            </div>
          </div>

          {/* Brand */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <span className="text-xl font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>
        </aside>

        {/* ── Right: player ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 shrink-0">
            <span className="eyebrow text-slate-500">AdCP Sandbox · {vehicle.label}</span>
            <span className="text-xl font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>

          {/* IMA player */}
          <div className="flex-1 overflow-hidden bg-black min-h-0">
            <ImaPlayer key={vehicle.make} adTagUrl={adTagUrl} />
          </div>
        </main>
      </div>

      {/* ── Bottom status bar ── */}
      <footer className="h-11 shrink-0 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-5">
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
          <span className="text-slate-300">{statusText}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 num">
          <span>🔋 {batteryPct}%</span>
          <span className="text-slate-700">·</span>
          <span>🕐 {remaining} min remaining</span>
        </div>
      </footer>
    </div>
  );
}
