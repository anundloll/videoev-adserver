"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  maskedDb:  string;
  vercelEnv: string;
  region:    string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ENDPOINTS = [
  {
    label: "Ad Decision",
    url:   "https://ads.videoev.com/api/decision",
    note:  "VAST 4.0 — accepts 9 targeting signals, returns winning creative",
  },
  {
    label: "Attribution Pixel",
    url:   "https://ads.videoev.com/api/track",
    note:  "1×1 GIF — impression · start · complete · qr_scan",
  },
  {
    label: "Campaigns API",
    url:   "https://ads.videoev.com/admin/api/campaigns",
    note:  "GET list / POST create — writes to Neon Campaign table",
  },
  {
    label: "VAST Test Call",
    url:   "https://ads.videoev.com/api/decision?car_make=tesla&msrp=120k%2B&battery=80&weather=sunny&venue=luxury_retail&location=suburban&dwell=45&time=morning&traffic=low",
    note:  "Live sample — Tesla · suburban · luxury retail · sunny",
  },
] as const;

const INFRA = [
  { label: "Vercel",        sub: "Deployments · Logs",         href: "https://vercel.com/arvin-nundlolls-projects" },
  { label: "Neon Database", sub: "neondb · us-east-1",         href: "https://console.neon.tech" },
  { label: "Clerk",         sub: "Auth · Users · Sessions",    href: "https://dashboard.clerk.com" },
  { label: "Resend",        sub: "Email · Leads · Auto-reply", href: "https://resend.com/emails" },
  { label: "Prisma Studio", sub: "localhost:5555",              href: "http://localhost:5555" },
  { label: "Ad Sandbox",    sub: "Kiosk + VAST debugger",      href: "https://ads.videoev.com" },
  { label: "Platform Docs", sub: "Master README · all domains", href: "/marketing/mission-control/docs" },
] as const;

// ─── Micro-components ─────────────────────────────────────────────────────────

function CopyButton({ text, compact }: { text: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setState("copied");
      setTimeout(() => setState("idle"), 1800);
    });
  }
  if (compact) {
    return (
      <button
        onClick={copy}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
          state === "copied"
            ? "text-teal-300"
            : "text-slate-600 hover:text-slate-300"
        }`}
      >
        {state === "copied" ? "✓" : "copy"}
      </button>
    );
  }
  return (
    <button
      onClick={copy}
      className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded border transition-all ${
        state === "copied"
          ? "bg-teal-500/10 text-teal-300 border-teal-500/30"
          : "text-slate-500 border-slate-700 hover:text-white hover:border-slate-500"
      }`}
    >
      {state === "copied" ? "✓ Copied" : "Copy"}
    </button>
  );
}

function LiveClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{t}</span>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id:             string;
  brandName:      string;
  sector:         string;
  baseCpm:        number;
  isActive:       boolean;
  conversionType: string;
  createdAt:      string;
  _count:         { trackingEvents: number };
}

interface TrackingEvent {
  id:         string;
  campaignId: string;
  sessionId:  string;
  eventType:  string;
  revenue:    number | null;
  createdAt:  string;
}

// ─── Data Explorer ────────────────────────────────────────────────────────────

function DataExplorer() {
  const [tab, setTab]           = useState<"campaigns" | "events">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents]     = useState<TrackingEvent[]>([]);
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/marketing/api/explorer");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
      setEvents(data.events ?? []);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25">Live Data Explorer</p>
        <button
          onClick={load}
          disabled={status === "loading"}
          className="text-[11px] font-medium px-3 py-1 rounded border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
        >
          {status === "loading" ? "Loading…" : "↺ Refresh"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-3">
        {(["campaigns", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t
                ? "bg-white/[0.08] text-white"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            {t === "campaigns" ? "Active Campaigns" : "Recent Events"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {status === "error" ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-red-400">{errorMsg}</p>
            <button onClick={load} className="mt-3 text-xs text-white/40 hover:text-white transition-colors">Retry</button>
          </div>
        ) : status === "loading" && campaigns.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-white/25">Fetching from Neon…</div>
        ) : tab === "campaigns" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Brand", "Sector", "CPM", "Events", "Status", "Created"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest uppercase text-white/25 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {campaigns.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-white/25">No campaigns yet</td></tr>
                ) : campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white/80 whitespace-nowrap">{c.brandName}</td>
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap">{c.sector}</td>
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap font-mono">${c.baseCpm.toFixed(2)}</td>
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap">{c._count.trackingEvents}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.isActive ? "bg-teal-500/10 text-teal-400" : "bg-white/[0.05] text-white/25"
                      }`}>
                        {c.isActive ? "● Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/25 whitespace-nowrap font-mono">{fmt(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Campaign ID", "Session", "Event", "Revenue", "Time"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest uppercase text-white/25 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {events.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-white/25">No events yet</td></tr>
                ) : events.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-white/30 whitespace-nowrap">{e.campaignId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-white/30 whitespace-nowrap">{e.sessionId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        e.eventType === "impression" ? "bg-blue-500/10 text-blue-400" :
                        e.eventType === "complete"   ? "bg-teal-500/10 text-teal-400" :
                        e.eventType === "qr_scan"    ? "bg-amber-500/10 text-amber-400" :
                                                       "bg-white/[0.05] text-white/40"
                      }`}>{e.eventType}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/40 whitespace-nowrap">
                      {e.revenue != null ? `$${Number(e.revenue).toFixed(4)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/25 whitespace-nowrap font-mono">{fmt(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MissionControl({ maskedDb, vercelEnv, region }: Props) {
  const isProd = vercelEnv === "production";

  return (
    <div className="h-screen overflow-y-auto bg-[#080c14] text-white antialiased">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#080c14]/90 backdrop-blur border-b border-white/[0.06] px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="#2dd4bf" />
            <circle cx="8" cy="8" r="6" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.3" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">VideoEV</span>
          <span className="text-white/20 text-sm">/</span>
          <span className="text-sm text-white/50">Mission Control</span>
        </div>

        {/* Status strip */}
        <div className="flex items-center gap-5 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-white/60">Systems online</span>
          </span>
          <span className="text-white/20">|</span>
          <span><LiveClock /></span>
          <span className="text-white/20">|</span>
          <span className={`font-medium ${isProd ? "text-teal-400" : "text-amber-400"}`}>
            {vercelEnv} · {region}
          </span>
        </div>
      </header>

      <div className="px-8 py-8 max-w-5xl mx-auto space-y-8">

        {/* ── Primary nav — asymmetric: 1 featured + 2 secondary ─────────── */}
        <div className="grid grid-cols-3 gap-3 h-52">

          {/* Featured — Campaign Admin */}
          <a
            href="https://ads.videoev.com/admin/campaigns"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 group relative overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-950/40 to-slate-900/60 p-6 flex flex-col justify-between hover:border-teal-400/40 transition-all duration-200"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-teal-400">Live</span>
                <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Campaign Admin</h2>
              <p className="mt-1.5 text-sm text-white/45 leading-relaxed max-w-xs">
                Create and configure campaigns. The auction engine reads from this in real time.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-teal-400/70 text-xs group-hover:text-teal-300 transition-colors">
              <span>ads.videoev.com/admin/campaigns</span>
              <span>↗</span>
            </div>
            {/* Subtle grid texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
          </a>

          {/* Secondary — stacked */}
          <div className="flex flex-col gap-3">
            <a
              href="https://data.videoev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 group rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col justify-between hover:border-violet-500/30 hover:bg-violet-950/20 transition-all duration-200"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-violet-400">Live</span>
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                </div>
                <h3 className="mt-1 text-sm font-semibold text-white/70 group-hover:text-white transition-colors">Client Analytics</h3>
              </div>
              <p className="text-[11px] text-white/30">data.videoev.com ↗</p>
            </a>
            <a
              href="https://ads.videoev.com/plugin/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 group rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col justify-between hover:border-amber-500/30 hover:bg-amber-950/20 transition-all duration-200"
            >
              <div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-500/60">Demo</span>
                <h3 className="mt-1 text-sm font-semibold text-white/70 group-hover:text-white transition-colors">CPO Demo Plugin</h3>
              </div>
              <p className="text-[11px] text-white/30">ads.videoev.com/plugin/demo ↗</p>
            </a>
          </div>
        </div>

        {/* ── System vitals — inline strip ───────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 grid grid-cols-4 divide-x divide-white/[0.06]">
          <div className="pr-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-sm font-medium text-teal-300">All systems go</span>
            </div>
          </div>
          <div className="px-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-1">Environment</p>
            <p className={`text-sm font-medium capitalize ${isProd ? "text-teal-300" : "text-amber-300"}`}>{vercelEnv}</p>
          </div>
          <div className="px-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-1">Stack</p>
            <p className="text-sm font-medium text-white/60">Next.js 16 · Prisma 7 · Neon</p>
          </div>
          <div className="pl-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25">Database</p>
              <CopyButton text={maskedDb} compact />
            </div>
            <p className="text-[11px] font-mono text-white/40 truncate">{maskedDb.split("@")[1] ?? maskedDb}</p>
          </div>
        </div>

        {/* ── Bottom: endpoints + infra ───────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_260px] gap-5">

          {/* Endpoints */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-3">API Endpoints</p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
              {ENDPOINTS.map((ep) => (
                <div key={ep.label} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white/80">{ep.label}</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/35 truncate">{ep.url}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{ep.note}</p>
                  </div>
                  <CopyButton text={ep.url} />
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-3">Infrastructure</p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
              {INFRA.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http://localhost") ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                >
                  <div>
                    <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{link.label}</p>
                    <p className="text-[11px] text-white/25">{link.sub}</p>
                  </div>
                  <span className="text-white/20 group-hover:text-white/50 transition-colors text-xs">↗</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ── Live Data Explorer ──────────────────────────────────────────── */}
        <DataExplorer />

      </div>
    </div>
  );
}
