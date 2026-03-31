"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  maskedDb:  string;
  vercelEnv: string;
  region:    string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_CARDS = [
  {
    label:       "Campaign Admin",
    description: "Create, configure & inspect live auction campaigns.",
    href:        "https://ads.videoev.com/admin/campaigns",
    accent:      "teal",
    icon:        "⚡",
    badge:       "Live",
  },
  {
    label:       "Client Analytics",
    description: "Publisher & advertiser attribution dashboard.",
    href:        "https://data.videoev.com",
    accent:      "violet",
    icon:        "📊",
    badge:       "Coming Soon",
  },
  {
    label:       "CPO Demo Plugin",
    description: "Embeddable kiosk plugin for prospective partners.",
    href:        "https://ads.videoev.com/plugin/demo",
    accent:      "amber",
    icon:        "🎬",
    badge:       "Demo",
  },
] as const;

const API_ENDPOINTS = [
  {
    label:       "Ad Decision",
    url:         "https://ads.videoev.com/api/decision",
    description: "VAST 4.0 — accepts targeting signals, returns winning creative",
  },
  {
    label:       "Attribution Pixel",
    url:         "https://ads.videoev.com/api/track",
    description: "1×1 GIF — fires impression, start, complete, qr_scan events",
  },
  {
    label:       "Campaigns API",
    url:         "https://ads.videoev.com/admin/api/campaigns",
    description: "GET list / POST create — reads & writes Neon Campaign table",
  },
  {
    label:       "VAST Sample",
    url:         "https://ads.videoev.com/api/decision?car_make=tesla&msrp=120k%2B&battery=80&weather=sunny&venue=luxury_retail&location=suburban&dwell=45&time=morning&traffic=low",
    description: "Live test call — Tesla, suburban, luxury retail, sunny",
  },
] as const;

const INFRA_LINKS = [
  {
    label:    "Vercel Dashboard",
    href:     "https://vercel.com/arvin-nundlolls-projects/videoev-adserver",
    sublabel: "Deployments · Logs · Env Vars",
    icon:     "▲",
  },
  {
    label:    "Neon Console",
    href:     "https://console.neon.tech",
    sublabel: "neondb · us-east-1 · Postgres",
    icon:     "🐘",
  },
  {
    label:    "Prisma Studio",
    href:     "http://localhost:5555",
    sublabel: "Run: npx prisma studio",
    icon:     "🔷",
  },
  {
    label:    "Ad Server Sandbox",
    href:     "https://ads.videoev.com",
    sublabel: "Live kiosk + VAST debugger",
    icon:     "📺",
  },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
        copied
          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
          : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500"
      }`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour:   "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="num tabular-nums">{time}</span>;
}

const ENV_STYLE: Record<string, string> = {
  production: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  preview:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  local:      "bg-slate-700/50 text-slate-300 border-slate-600",
};

const ACCENT_CARD: Record<string, string> = {
  teal:   "hover:border-teal-500/50 hover:shadow-teal-900/30",
  violet: "hover:border-violet-500/50 hover:shadow-violet-900/30",
  amber:  "hover:border-amber-500/50 hover:shadow-amber-900/30",
};

const ACCENT_BADGE: Record<string, string> = {
  teal:   "bg-teal-500/15 text-teal-300",
  violet: "bg-violet-500/15 text-violet-300",
  amber:  "bg-amber-500/15 text-amber-300",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function MissionControl({ maskedDb, vercelEnv, region }: Props) {
  const envStyle = ENV_STYLE[vercelEnv] ?? ENV_STYLE.local;

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-white font-sans">

      {/* Header */}
      <header className="border-b border-slate-800/60 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-400">VideoEV</span>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-semibold text-white">Mission Control</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Clock />
            <span className={`px-2 py-0.5 rounded border text-[11px] font-medium uppercase tracking-wider ${envStyle}`}>
              {vercelEnv}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-10">

        {/* ── Navigation Hub ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-4">
            Navigation Hub
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {NAV_CARDS.map(card => (
              <a
                key={card.label}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 ${ACCENT_CARD[card.accent]}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{card.icon}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACCENT_BADGE[card.accent]}`}>
                    {card.badge}
                  </span>
                </div>
                <p className="text-base font-semibold text-white mb-1 group-hover:text-teal-300 transition-colors">
                  {card.label}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                <p className="mt-3 text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  Open ↗
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* ── System Vitals ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-4">
            System Vitals
          </h2>
          <div className="grid grid-cols-3 gap-4">

            {/* Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">System Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-sm font-semibold text-teal-300">All Systems Online</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Neon · Vercel · AdCP · VAST 4.0</p>
            </div>

            {/* Environment */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Environment</p>
              <p className="text-sm font-semibold text-white capitalize">{vercelEnv}</p>
              <p className="text-xs text-slate-600 mt-1">Region: {region}</p>
              <p className="text-xs text-slate-600">Next.js 16 · Turbopack</p>
            </div>

            {/* Database */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Database</p>
                <CopyButton text={maskedDb} />
              </div>
              <p className="text-xs font-mono text-slate-300 break-all leading-relaxed">{maskedDb}</p>
            </div>

          </div>
        </section>

        {/* ── Bottom two columns ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Quick-Copy Snippets */}
          <section>
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-4">
              Quick-Copy Endpoints
            </h2>
            <div className="space-y-2">
              {API_ENDPOINTS.map(ep => (
                <div
                  key={ep.label}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-semibold text-white">{ep.label}</span>
                    <CopyButton text={ep.url} />
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate mb-1">{ep.url}</p>
                  <p className="text-[11px] text-slate-600">{ep.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Infrastructure Links */}
          <section>
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-4">
              Infrastructure
            </h2>
            <div className="space-y-2">
              {INFRA_LINKS.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http://localhost") ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-600 hover:bg-slate-800/60 transition-all group"
                >
                  <span className="text-xl w-7 text-center">{link.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-teal-300 transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{link.sublabel}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">↗</span>
                </a>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
