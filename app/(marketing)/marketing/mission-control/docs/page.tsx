'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Table of contents ────────────────────────────────────────────────────────

const TOC = [
  { id: 'overview',        label: 'Platform Overview' },
  { id: 'architecture',   label: 'Architecture' },
  { id: 'ads',            label: 'ads.videoev.com' },
  { id: 'data',           label: 'data.videoev.com' },
  { id: 'demo',           label: 'demo.videoev.com' },
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'data-flow',      label: 'End-to-End Data Flow' },
  { id: 'api-reference',  label: 'API Reference' },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="-mt-20 pt-20 invisible absolute" aria-hidden />;
}

function Tag({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'violet' | 'amber' | 'sky' | 'slate' }) {
  const map = {
    teal:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    sky:    'text-sky-400 bg-sky-500/10 border-sky-500/20',
    slate:  'text-slate-400 bg-slate-700/40 border-slate-700/60',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${map[color]}`}>
      {children}
    </span>
  );
}

function CodeBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          {label && <span className="ml-2 text-[10px] font-mono text-white/25">{label}</span>}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${copied ? 'text-teal-400' : 'text-white/25 hover:text-white/60'}`}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="px-5 py-4 text-xs font-mono text-white/60 leading-relaxed overflow-x-auto whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-teal-300 font-mono text-[12px] bg-teal-950/40 border border-teal-900/40 rounded px-1.5 py-0.5">{children}</code>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' | 'tip' }) {
  const map = {
    info:    { border: 'border-teal-900/50',   bg: 'bg-teal-950/30',   text: 'text-teal-400',   icon: 'ℹ' },
    warning: { border: 'border-amber-900/50',  bg: 'bg-amber-950/30',  text: 'text-amber-400',  icon: '⚠' },
    tip:     { border: 'border-violet-900/50', bg: 'bg-violet-950/30', text: 'text-violet-400', icon: '✦' },
  };
  const s = map[variant];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} px-5 py-4 flex gap-3`}>
      <span className={`${s.text} shrink-0 mt-0.5`}>{s.icon}</span>
      <div className="text-sm text-white/55 leading-relaxed">{children}</div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold text-white mb-4 mt-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-white/80 mb-3 mt-6">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/50 leading-relaxed mb-4">{children}</p>;
}

// ─── Architecture SVG diagram ─────────────────────────────────────────────────

function ArchDiagram() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 overflow-x-auto">
      <svg viewBox="0 0 820 340" className="w-full max-w-3xl mx-auto" style={{ minWidth: 600 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.2)" />
          </marker>
          <marker id="arrow-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#2dd4bf" />
          </marker>
        </defs>

        {/* Kiosk hardware */}
        <rect x="20" y="120" width="130" height="80" rx="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="5,3"/>
        <text x="85" y="152" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">Charging Kiosk</text>
        <text x="85" y="168" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">VAST player</text>
        <text x="85" y="182" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">OCPP signals</text>

        {/* Arrow: kiosk → ads */}
        <line x1="150" y1="160" x2="210" y2="160" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-teal)"/>
        <text x="180" y="153" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontFamily="monospace">VAST req</text>

        {/* ads.videoev.com */}
        <rect x="215" y="90" width="160" height="140" rx="12" fill="rgba(45,212,191,0.05)" stroke="rgba(45,212,191,0.25)" strokeWidth="1.5"/>
        <text x="295" y="118" textAnchor="middle" fill="#2dd4bf" fontSize="11" fontWeight="bold" fontFamily="monospace">ads.videoev.com</text>
        <text x="295" y="135" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">Auction Engine</text>
        <rect x="233" y="145" width="124" height="18" rx="4" fill="rgba(45,212,191,0.08)"/>
        <text x="295" y="157" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/api/decision</text>
        <rect x="233" y="168" width="124" height="18" rx="4" fill="rgba(45,212,191,0.08)"/>
        <text x="295" y="180" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/api/track</text>
        <rect x="233" y="191" width="124" height="18" rx="4" fill="rgba(45,212,191,0.08)"/>
        <text x="295" y="203" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/admin/campaigns</text>

        {/* Arrow: ads → neon (down) */}
        <line x1="295" y1="230" x2="295" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" markerEnd="url(#arrow)"/>

        {/* Neon DB */}
        <rect x="210" y="275" width="170" height="50" rx="10" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"/>
        <text x="295" y="298" textAnchor="middle" fill="rgba(165,180,252,0.7)" fontSize="11" fontWeight="bold" fontFamily="monospace">Neon PostgreSQL</text>
        <text x="295" y="314" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">Shared · us-east-1</text>

        {/* Arrow: neon → data (up-right) */}
        <line x1="380" y1="295" x2="445" y2="230" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" markerEnd="url(#arrow)"/>

        {/* Arrow: data → neon (down-left) */}
        <line x1="460" y1="230" x2="400" y2="285" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5" markerEnd="url(#arrow)"/>

        {/* data.videoev.com */}
        <rect x="445" y="90" width="160" height="140" rx="12" fill="rgba(167,139,250,0.05)" stroke="rgba(167,139,250,0.25)" strokeWidth="1.5"/>
        <text x="525" y="118" textAnchor="middle" fill="rgba(196,181,253,0.85)" fontSize="11" fontWeight="bold" fontFamily="monospace">data.videoev.com</text>
        <text x="525" y="135" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">Client DSP</text>
        <rect x="463" y="145" width="124" height="18" rx="4" fill="rgba(167,139,250,0.08)"/>
        <text x="525" y="157" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/api/campaigns</text>
        <rect x="463" y="168" width="124" height="18" rx="4" fill="rgba(167,139,250,0.08)"/>
        <text x="525" y="180" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/api/upload</text>
        <rect x="463" y="191" width="124" height="18" rx="4" fill="rgba(167,139,250,0.08)"/>
        <text x="525" y="203" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">/api/predict-bid</text>

        {/* Vercel Blob */}
        <rect x="445" y="275" width="160" height="50" rx="10" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.2)" strokeWidth="1.5"/>
        <text x="525" y="298" textAnchor="middle" fill="rgba(125,211,252,0.7)" fontSize="11" fontWeight="bold" fontFamily="monospace">Vercel Blob</text>
        <text x="525" y="314" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">Video creatives · CDN</text>
        <line x1="525" y1="230" x2="525" y2="274" stroke="rgba(14,165,233,0.35)" strokeWidth="1.5" markerEnd="url(#arrow)"/>

        {/* demo.videoev.com */}
        <rect x="635" y="90" width="160" height="100" rx="12" fill="rgba(251,191,36,0.04)" stroke="rgba(251,191,36,0.2)" strokeWidth="1.5" strokeDasharray="5,3"/>
        <text x="715" y="118" textAnchor="middle" fill="rgba(253,224,71,0.7)" fontSize="11" fontWeight="bold" fontFamily="monospace">demo.videoev.com</text>
        <text x="715" y="135" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">Sales Demo</text>
        <text x="715" y="155" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">Client-side only</text>
        <text x="715" y="170" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">No DB connection</text>

        {/* Next.js middleware label */}
        <rect x="218" y="38" width="390" height="32" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="413" y="56" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">Next.js middleware — routes by Host header → route groups</text>

        {/* Bracket line for the two domains sharing one deployment */}
        <line x1="218" y1="70" x2="218" y2="90" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <line x1="608" y1="70" x2="608" y2="90" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <line x1="218" y1="70" x2="608" y2="70" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      </svg>
      <p className="text-[10px] text-white/20 text-center mt-2 font-mono">ads + data share one Vercel deployment · one Neon database · one Prisma connection pool</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlatformDocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = TOC.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    observerRef.current = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveSection(entry.target.id); break; }
        }
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    sections.forEach(s => observerRef.current?.observe(s));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white antialiased">

      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#080c14]/90 backdrop-blur border-b border-white/[0.06] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="#2dd4bf"/>
            <circle cx="8" cy="8" r="6" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.3"/>
          </svg>
          <span className="text-sm font-semibold tracking-tight">VideoEV</span>
          <span className="text-white/20">/</span>
          <a href="/marketing/mission-control" className="text-sm text-white/40 hover:text-white/70 transition-colors">Mission Control</a>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/60">Platform Docs</span>
        </div>
        <a
          href="/marketing/mission-control"
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 border border-white/[0.08] hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
        >
          ← Mission Control
        </a>
      </header>

      <div className="flex max-w-6xl mx-auto">

        {/* ── Sidebar TOC ───────────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto py-10 px-4 border-r border-white/[0.05]">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-4 px-3">Contents</p>
          <nav className="space-y-0.5">
            {TOC.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block px-3 py-2 rounded-lg text-xs transition-all ${
                  activeSection === item.id
                    ? 'bg-white/[0.06] text-white font-medium'
                    : 'text-white/35 hover:text-white/65 hover:bg-white/[0.03]'
                }`}
              >
                {activeSection === item.id && (
                  <span className="inline-block w-1 h-1 rounded-full bg-teal-400 mr-2 mb-0.5" />
                )}
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-10 px-3">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/15 mb-3">Quick links</p>
            {[
              { label: 'Campaign Admin',  href: 'https://ads.videoev.com/admin/campaigns' },
              { label: 'Client DSP',      href: 'https://data.videoev.com' },
              { label: 'Sales Demo',      href: 'https://demo.videoev.com' },
              { label: 'API Docs',        href: 'https://ads.videoev.com/docs' },
              { label: 'Vercel',          href: 'https://vercel.com' },
              { label: 'Neon Console',    href: 'https://console.neon.tech' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                className="block text-[11px] text-white/25 hover:text-teal-400 transition-colors py-1">
                {l.label} ↗
              </a>
            ))}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-8 xl:px-14 py-12 space-y-20">

          {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="overview" />
            <Tag>Platform Overview</Tag>
            <H2>VideoEV — Master Platform Reference</H2>
            <P>
              VideoEV is a programmatic video advertising network built for EV charging stations.
              While a driver charges their vehicle — a captive, dwell-heavy session averaging 24 minutes — a
              targeted video ad plays on the kiosk screen, selected in real time using signals pulled
              directly from the vehicle and its environment via OCPP telemetry.
            </P>
            <P>
              The platform is split across three public-facing domains and one internal ops surface,
              all sharing a single PostgreSQL database. A campaign created by an advertiser in the
              client portal enters the live auction engine within milliseconds — no syncs, no webhooks,
              no cache invalidation.
            </P>

            {/* Domain summary grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                {
                  domain: 'ads.videoev.com',
                  label: 'Ad Server',
                  color: 'teal' as const,
                  who: 'VideoEV operators',
                  what: 'Real-time VAST 4.0 auction engine + campaign admin. The engine room of the platform.',
                },
                {
                  domain: 'data.videoev.com',
                  label: 'Client DSP',
                  color: 'violet' as const,
                  who: 'Advertising agencies & brand managers',
                  what: 'Self-serve portal for creating campaigns, uploading creatives, and reading live analytics.',
                },
                {
                  domain: 'demo.videoev.com',
                  label: 'Sales Demo',
                  color: 'amber' as const,
                  who: 'Charging network partners & investors',
                  what: 'Interactive simulation of the driver experience across kiosk, mobile, and in-car surfaces.',
                },
                {
                  domain: 'mission-control',
                  label: 'Internal Ops',
                  color: 'sky' as const,
                  who: 'VideoEV engineering team',
                  what: 'Live system dashboard — health vitals, API endpoints, DB explorer, infrastructure links.',
                },
              ].map(d => (
                <div key={d.domain} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag color={d.color}>{d.label}</Tag>
                  </div>
                  <p className="text-xs font-mono text-white/40 mb-2">{d.domain}</p>
                  <p className="text-[11px] text-white/25 mb-1 font-medium uppercase tracking-wider">Audience</p>
                  <p className="text-sm text-white/55 mb-3">{d.who}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{d.what}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── ARCHITECTURE ─────────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="architecture" />
            <Tag color="slate">Architecture</Tag>
            <H2>How the Platform Fits Together</H2>
            <P>
              All production domains — <InlineCode>ads.*</InlineCode>, <InlineCode>data.*</InlineCode>, and the marketing portal —
              run as a single Next.js 16 deployment on Vercel. A middleware layer reads the incoming <InlineCode>Host</InlineCode> header
              and rewrites the request to the correct route group before it reaches any page or API handler.
            </P>
            <ArchDiagram />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { host: 'ads.videoev.com',  routes: '/(adserver)/adserver/...', note: 'Auction engine + admin' },
                { host: 'data.videoev.com', routes: '/(data)/data/...',         note: 'Client DSP + brand APIs' },
                { host: '*.videoev.com',    routes: '/(marketing)/marketing/...', note: 'Landing page + Mission Control' },
              ].map(r => (
                <div key={r.host} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-mono text-teal-400/70 mb-1">{r.host}</p>
                  <p className="text-[10px] font-mono text-white/30 mb-2">→ {r.routes}</p>
                  <p className="text-[11px] text-white/35">{r.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── ADS.VIDEOEV.COM ───────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="ads" />
            <Tag color="teal">Ad Server</Tag>
            <H2>ads.videoev.com — The Engine Room</H2>
            <P>
              This is the core infrastructure. Every ad impression served across the entire charging network
              flows through this domain. It is not customer-facing — it is operated by the VideoEV team.
              Think of it as God Mode: full visibility across all brands, all campaigns, all events.
            </P>

            <InfoBox variant="tip">
              The Campaign Admin at <strong>/admin/campaigns</strong> is deliberately unrestricted — it can read and write
              campaigns for any brand. The client-facing equivalent at <strong>data.videoev.com</strong> is brand-locked
              server-side and is what advertisers use.
            </InfoBox>

            <H3>The auction flow — step by step</H3>
            <div className="space-y-3 mt-2">
              {[
                { step: '01', title: 'Kiosk sends targeting signals', body: 'When a vehicle plugs in, the OCPP handshake populates up to 9 real-time signals: car_make, battery level, MSRP tier, venue type, location, dwell estimate, weather, time of day, and traffic density.' },
                { step: '02', title: 'Decision endpoint receives the request', body: 'GET /api/decision queries all active campaigns from Neon. Each campaign row contains a base CPM, bid multiplier rules, and affinity tags.' },
                { step: '03', title: 'Scoring', body: 'Every active campaign is scored: base CPM × matching bid multipliers + (10 points per matching affinity tag). The highest total score wins. Tie goes to the higher CPM.' },
                { step: '04', title: 'VAST 4.0 response', body: 'The winning campaign is serialised into a VAST 4.0 XML document containing the video URL, all impression/tracking pixels, and a VideoEV extension block with the full placement context.' },
                { step: '05', title: 'Tracking pixels fire', body: 'As the ad plays, the kiosk fires GET /api/track for each event (impression, start, complete, qr_scan). Each event writes a TrackingEvent row to Neon with revenue = baseCpm × multiplier.' },
              ].map(s => (
                <div key={s.step} className="flex gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-[11px] font-bold text-white/15 font-mono mt-0.5 shrink-0 w-6">{s.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-white/70 mb-1">{s.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <H3>Routes at a glance</H3>
            <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
              {[
                { method: 'GET',  path: '/api/decision',         note: 'VAST 4.0 auction — 9 targeting signals → winning creative' },
                { method: 'GET',  path: '/api/track',            note: '1×1 GIF attribution pixel — impression · start · complete · qr_scan' },
                { method: 'GET',  path: '/admin/api/campaigns',  note: 'List all campaigns across all brands (God Mode — no brand filter)' },
                { method: 'POST', path: '/admin/api/campaigns',  note: 'Create a campaign for any brand' },
                { method: 'GET',  path: '/admin/campaigns',      note: 'Campaign manager UI — sidebar nav, creative preview, reach estimator' },
                { method: 'GET',  path: '/plugin/demo',          note: 'CPO integration demo — shows charging operators how to embed the player' },
                { method: 'GET',  path: '/docs',                 note: 'VAST API developer documentation' },
              ].map(r => (
                <div key={r.path} className="flex items-center gap-4 px-5 py-3 bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    r.method === 'GET'
                      ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>{r.method}</span>
                  <span className="font-mono text-xs text-white/50 shrink-0">{r.path}</span>
                  <span className="text-xs text-white/25">{r.note}</span>
                </div>
              ))}
            </div>

            <H3>Sample auction request</H3>
            <CodeBlock label="Request — Porsche at luxury retail">
{`GET https://ads.videoev.com/api/decision
  ?car_make=porsche
  &msrp=120k%2B
  &battery=80
  &venue=luxury_retail
  &location=suburban
  &dwell=45
  &weather=sunny
  &time=morning
  &traffic=low`}
            </CodeBlock>
          </section>

          {/* ── DATA.VIDEOEV.COM ──────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="data" />
            <Tag color="violet">Client DSP</Tag>
            <H2>data.videoev.com — The Advertiser Portal</H2>
            <P>
              This is what a brand manager at Dentsu, Publicis, or an in-house agency sees after signing a deal
              with VideoEV. It is a self-serve Demand-Side Platform — they create campaigns, upload creatives,
              monitor performance, and explore the audience. All data is hard-scoped to their brand server-side;
              they cannot see other brands' campaigns or revenue.
            </P>

            <InfoBox variant="warning">
              Brand isolation is enforced entirely server-side. Every database query in the <InlineCode>/data/api/</InlineCode> routes
              filters by <InlineCode>brandName = BRAND_FILTER</InlineCode>. The client never sends a brand token — the server
              derives it from the session. Until real auth ships, <InlineCode>BRAND_FILTER = &apos;Dentsu&apos;</InlineCode> is hardcoded
              in both <InlineCode>page.tsx</InlineCode> and all API routes.
            </InfoBox>

            <H3>The four tabs</H3>
            <div className="space-y-3">
              {[
                {
                  tab: 'Overview',
                  color: 'border-teal-900/40',
                  items: [
                    'Total Plays (impression events), QR Scans, Total Spend, Completion Rate — live from Neon, no cache',
                    '30-day impression pulse chart — day-by-day bar chart of impression volume',
                    'Live indicator — green pulse if any event fired in the last 5 minutes. Uses the same Prisma connection pool as the auction engine, so latency is effectively zero',
                    'Unique Vehicles — distinct sessionIds across all brand tracking events',
                  ],
                },
                {
                  tab: 'Audience & Identity',
                  color: 'border-violet-900/40',
                  items: [
                    'Vehicle make breakdown — bar chart of Tesla / BMW / Porsche etc., sourced from OCPP VehicleProfile rows',
                    'MSRP wealth tiers — Accessible (<$40k) / Affluent ($40k–$80k) / High Net Worth ($80k–$150k) / Ultra Luxury ($150k+)',
                    'Avg dwell time — from hardware-ingested profiles, or 24-min AFDC industry average if no data yet',
                    'PredictBid — audience segment simulator: picks a segment, queries matching VehicleProfiles, applies multipliers, returns estimated CPM / reach / monthly revenue with confidence rating',
                    'CSV dropzone and coverage zone map (UI layer, backend wiring in progress)',
                  ],
                },
                {
                  tab: 'Campaigns',
                  color: 'border-amber-900/40',
                  items: [
                    'Full campaign list with hover-to-play video thumbnail previews (VideoPreviewCell — plays with sound)',
                    'New campaign form: sector, CPM, conversion type, CTA copy, targeting rules, affinities',
                    'Vercel Blob video upload — browser uploads directly to blob storage (two-phase token pattern). Progress bar, drag-drop or click. After upload the creativeUrl is embedded in the campaign and synced to the auction engine on save',
                    'Campaigns saved here enter the live auction immediately — same DB, zero delay',
                  ],
                },
                {
                  tab: 'Creatives',
                  color: 'border-sky-900/40',
                  items: [
                    'Asset library showing all uploaded video and HTML5 creatives with status (Approved / Under Review / Pending)',
                    'Real Vercel Blob upload — drag-drop or click-to-browse, live progress bar, post-upload hover-play preview',
                    'Approved creatives are automatically served by the auction engine via creativeUrl on the Campaign row',
                  ],
                },
              ].map(t => (
                <div key={t.tab} className={`rounded-xl border ${t.color} bg-white/[0.02] p-5`}>
                  <p className="text-sm font-semibold text-white/70 mb-3">{t.tab}</p>
                  <ul className="space-y-1.5">
                    {t.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/40 leading-relaxed">
                        <span className="text-white/15 shrink-0 mt-0.5">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <H3>How campaign creation reaches the auction</H3>
            <CodeBlock label="POST /api/campaigns — creates a campaign and enters the auction immediately">
{`// 1. Client submits the campaign form
POST https://data.videoev.com/api/campaigns
{
  "sector":         "Luxury",
  "baseCpm":        55,
  "creativeUrl":    "https://public.blob.vercel-storage.com/creatives/rolex-30s.mp4",
  "conversionType": "QR_Discount",
  "ctaCopy":        "Scan for exclusive offer",
  "targetingRules": {
    "bidMultipliers":  { "rain": 1.0, "lowBattery": 1.0, "weekend": 1.2 },
    "targetAffinities": ["affluent", "high_net_worth", "luxury_buyer"]
  }
}

// 2. Route locks brandName server-side — client cannot override
//    prisma.campaign.create({ data: { brandName: "Dentsu", ...body } })

// 3. Next request to /api/decision at ads.videoev.com picks up the new campaign
//    — same Neon DB, same Prisma client singleton, zero propagation delay`}
            </CodeBlock>
          </section>

          {/* ── DEMO.VIDEOEV.COM ──────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="demo" />
            <Tag color="amber">Sales Demo</Tag>
            <H2>demo.videoev.com — The Driver Experience</H2>
            <P>
              This is the sales tool used when pitching charging network partners (Electrify America, Applegreen,
              Revel, BP Pulse, etc.) and investors. It simulates what a driver sees during a real charging session —
              entirely client-side, no backend, works offline on a laptop at a pitch meeting.
            </P>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { mode: 'Kiosk', dims: '1920×1080 · 16:9', note: 'The charging station screen. Large type, readable at 2 metres. Primary ad surface.' },
                { mode: 'Mobile App', dims: '375px · iOS proportions', note: 'The VideoEV companion app. Driver can interact with the QR CTA from their phone.' },
                { mode: 'In-Car Tablet', dims: '1024×600 · landscape', note: 'Embedded screen in premium EVs. Mid-sized text, touch-optimised.' },
              ].map(m => (
                <div key={m.mode} className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4">
                  <p className="text-sm font-semibold text-amber-300/70 mb-1">{m.mode}</p>
                  <p className="text-[10px] font-mono text-white/25 mb-2">{m.dims}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>

            <H3>The charging flow</H3>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {['idle', 'vehicle_detect', 'auth', 'charging', 'complete'].map((stage, i, arr) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/50 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5">{stage}</span>
                  {i < arr.length - 1 && <span className="text-white/20">→</span>}
                </div>
              ))}
            </div>
            <P>
              During the <InlineCode>charging</InlineCode> stage the 5-tier targeting waterfall runs client-side and selects the best ad
              from a library of 52 demo brands. The selected ad plays via Amazon IVS with a live CPM counter,
              AI targeting reasoning, and QR code overlay.
            </P>

            <H3>Smart targeting waterfall</H3>
            <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
              {[
                { tier: '1', label: 'Brand affinity',       example: 'Porsche → Rolex · Lucid → Hermès · Volvo → NetJets' },
                { tier: '2', label: 'Vehicle make cross-sell', example: 'BMW driver → BMW Financial Services' },
                { tier: '3', label: 'Audience profile match', example: 'Rivian → Patagonia (adventure/outdoor profile)' },
                { tier: '4', label: 'Interests & behaviour',  example: 'Genesis → Canyon Ranch (wellness luxury)' },
                { tier: '5', label: 'Income bracket fallback', example: 'Any MSRP > $80k → luxury CPG default' },
              ].map(t => (
                <div key={t.tier} className="flex gap-4 px-5 py-3.5 bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                  <span className="text-[10px] font-bold text-white/15 font-mono w-4 shrink-0 mt-0.5">T{t.tier}</span>
                  <div>
                    <p className="text-xs font-medium text-white/55">{t.label}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{t.example}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox variant="info">
              The demo is in a separate repo at <InlineCode>../videoev-demo</InlineCode> on branch <InlineCode>ev-charging-demo</InlineCode>.
              Deploy with <InlineCode>npm run deploy</InlineCode>. It does not share the Neon database — all targeting is a
              self-contained client-side rule engine. To upgrade to production targeting, replace <InlineCode>selectBestAdForVehicle()</InlineCode> with a call to <InlineCode>ads.videoev.com/api/decision</InlineCode>.
            </InfoBox>
          </section>

          {/* ── MISSION CONTROL ───────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="mission-control" />
            <Tag color="sky">Internal Ops</Tag>
            <H2>Mission Control — System Dashboard</H2>
            <P>
              The internal ops surface for the VideoEV engineering team. Accessible at
              <InlineCode>ads.videoev.com/marketing/mission-control</InlineCode>. Not linked from
              any public surface.
            </P>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'System vitals strip',    note: 'Live clock, Vercel environment (production / preview / local), region, masked database connection string with copy button.' },
                { label: 'Primary nav cards',       note: 'Featured link to Campaign Admin, secondary links to Client Analytics and the CPO Demo Plugin.' },
                { label: 'API Endpoints panel',     note: 'One-click copy for all four live API URLs: Decision, Attribution Pixel, Campaigns API, and a pre-built VAST test call.' },
                { label: 'Infrastructure links',    note: 'Direct links to Vercel dashboard, Neon console, Prisma Studio (localhost:5555), and the Ad Sandbox.' },
                { label: 'Live Data Explorer',      note: 'Queries the Neon database in real time — view all active campaigns (any brand) and the most recent tracking events. Refresh button included.' },
                { label: 'Platform Docs',           note: 'This page — the master README explaining every surface, the shared data model, and how it all connects.' },
              ].map(c => (
                <div key={c.label} className="rounded-xl border border-sky-900/30 bg-sky-950/10 p-4">
                  <p className="text-sm font-medium text-sky-300/60 mb-1.5">{c.label}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{c.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── INFRASTRUCTURE ────────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="infrastructure" />
            <Tag color="slate">Infrastructure</Tag>
            <H2>Infrastructure Deep Dive</H2>

            <H3>One deployment, three domains</H3>
            <P>
              The entire platform is a single Next.js 16 app deployed to Vercel. The route group convention
              — <InlineCode>(adserver)</InlineCode>, <InlineCode>(data)</InlineCode>, <InlineCode>(marketing)</InlineCode> — keeps each
              domain&apos;s pages and API routes organised without leaking routes across subdomains.
            </P>
            <CodeBlock label="Middleware routing logic (simplified)">
{`// middleware.ts — runs on every request before any page handler
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const url  = request.nextUrl.clone();

  if (host.startsWith('ads.'))  url.pathname = '/adserver' + url.pathname;
  if (host.startsWith('data.')) url.pathname = '/data'     + url.pathname;
  // else: marketing / mission control

  return NextResponse.rewrite(url);
}`}
            </CodeBlock>

            <H3>Prisma singleton — zero-latency cross-domain sync</H3>
            <P>
              All subdomains import from <InlineCode>@/lib/prisma</InlineCode> — a single module-level Prisma client
              instance. In production on Vercel, each serverless function initialises its own connection,
              but they all point at the same Neon database. The result: a campaign saved by the client DSP
              is visible to the auction engine on the very next request.
            </P>
            <CodeBlock label="lib/prisma.ts">
{`import { PrismaClient }  from '@/lib/generated/prisma';
import { PrismaNeon }    from '@prisma/adapter-neon';
import { Pool }          from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL })) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`}
            </CodeBlock>

            <H3>Vercel Blob — large video without server buffering</H3>
            <P>
              Video uploads use the <InlineCode>@vercel/blob/client</InlineCode> two-phase pattern. The browser
              never sends the video file through the Next.js server (which has a 4 MB body limit by default).
              Instead it fetches a short-lived client token from the server, then uploads directly from the
              browser to Vercel&apos;s CDN edge.
            </P>
            <CodeBlock label="Two-phase upload flow">
{`// Phase 1 — browser calls the server to get a client token
POST /api/upload  { action: "generateClientToken", pathname: "filename.mp4" }
→ Server validates, returns a short-lived token (10-min TTL, 500 MB max)

// Phase 2 — browser uploads directly to Vercel Blob edge
// (Vercel SDK handles this internally in upload())
→ On complete, Vercel calls back POST /api/upload  { action: "completeUpload" }
→ Server writes creativeUrl to Campaign row in Neon

// Result: 500 MB video, zero server memory pressure`}
            </CodeBlock>

            <H3>OCPP Vehicle Intelligence</H3>
            <P>
              EV charging hardware sends OCPP (Open Charge Point Protocol) events when a vehicle plugs in.
              The <InlineCode>POST /api/vehicles</InlineCode> endpoint ingests these events and upserts a
              <InlineCode>VehicleProfile</InlineCode> row keyed by <InlineCode>sessionId</InlineCode>. Mid-session
              updates (e.g., final kWh delivered) are handled via upsert — no duplicate rows.
            </P>
            <P>
              Vehicle profiles power the Audience &amp; Identity tab in the client DSP: make breakdown,
              MSRP wealth tiers, avg dwell, and the PredictBid revenue simulation. In development, seed
              40 realistic profiles by hitting <InlineCode>POST /api/vehicles?seed=1</InlineCode>.
            </P>

            <H3>Stack versions</H3>
            <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
              {[
                { label: 'Next.js',              version: '16.2.1',  note: 'App Router · Turbopack · Server Components' },
                { label: 'Prisma',               version: '7.6.0',   note: 'With @prisma/adapter-pg driver adapter for Neon' },
                { label: 'Neon PostgreSQL',       version: 'Serverless', note: 'us-east-1 · HTTP-based driver (works in edge runtime)' },
                { label: '@vercel/blob',          version: 'latest',  note: 'Client-upload pattern · BLOB_READ_WRITE_TOKEN env var required' },
                { label: 'Tailwind CSS',          version: '4',       note: 'Utility-first · custom tokens in index.css' },
                { label: 'Amazon IVS',            version: 'latest',  note: 'Low-latency video streaming in demo.videoev.com' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-medium text-white/55 w-40 shrink-0">{r.label}</span>
                  <span className="text-xs font-mono text-teal-400/60 w-24 shrink-0">{r.version}</span>
                  <span className="text-xs text-white/25">{r.note}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── END TO END DATA FLOW ─────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="data-flow" />
            <Tag color="teal">End-to-End Flow</Tag>
            <H2>A Campaign, From Brief to Impression</H2>
            <P>
              Here is the complete lifecycle of an ad — from an agency creating a campaign to revenue
              appearing in their dashboard.
            </P>
            <div className="space-y-2">
              {[
                { n: '1', label: 'Agency logs into data.videoev.com',       detail: 'Server-side brand filter activates. All queries are scoped to their brandName.' },
                { n: '2', label: 'Campaign form filled out',                 detail: 'Sector, CPM, conversion goal, targeting rules, affinity tags.' },
                { n: '3', label: 'Video creative uploaded via drag-drop',    detail: 'Browser fetches a client token from /api/upload, uploads directly to Vercel Blob. creativeUrl returned.' },
                { n: '4', label: 'Campaign saved',                           detail: 'POST /api/campaigns writes to Neon. creativeUrl and targetingRules are stored on the Campaign row.' },
                { n: '5', label: 'Vehicle plugs in at a charging station',   detail: 'OCPP handshake generates sessionId, car_make, MSRP, battery, venue, dwell estimate.' },
                { n: '6', label: 'Kiosk requests an ad',                     detail: 'GET /api/decision with all 9 signals. Auction engine loads all active campaigns from Neon.' },
                { n: '7', label: 'Campaign wins the auction',                detail: 'Score = baseCpm × matching multipliers + (10 × matching affinity tags). Highest score wins.' },
                { n: '8', label: 'VAST 4.0 XML returned to kiosk',           detail: 'Contains the Vercel Blob video URL, tracking pixels, full placement context in VideoEV VAST extension.' },
                { n: '9', label: 'Ad plays with sound',                      detail: 'MediaFile audioEnabled="true". Audio extension in VAST confirms autoplay-with-sound intent.' },
                { n: '10', label: 'Tracking pixels fire',                    detail: 'impression → start → complete (→ qr_scan if driver scans QR). Each event writes a TrackingEvent row with revenue.' },
                { n: '11', label: 'Agency refreshes their dashboard',        detail: 'Overview tab queries sum(revenue)/1000, completion rate, pulse chart. All queries read from the same DB — data is live.' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 px-5 py-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                  <span className="text-[10px] font-bold text-white/15 font-mono w-5 shrink-0 mt-0.5 text-right">{s.n}</span>
                  <div>
                    <p className="text-sm font-medium text-white/60">{s.label}</p>
                    <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── API REFERENCE ─────────────────────────────────────────────────── */}
          <section className="relative">
            <SectionAnchor id="api-reference" />
            <Tag color="slate">API Reference</Tag>
            <H2>Full API Reference</H2>

            <H3>ads.videoev.com — public endpoints</H3>
            <div className="space-y-4">
              <CodeBlock label="GET /api/decision — targeting parameters">
{`car_make   String   tesla · porsche · lucid · bmw · rivian · genesis · cadillac · jaguar · polestar · volvo
battery    Integer  State of charge 0–100
msrp       String   200k+ · 120k+ · 80k-120k · 40k-80k · under-40k
venue      String   luxury_retail · airport · mall · hospital · office · highway_rest
location   String   highway · urban · suburban · shopping · airport · stadium · hospital
dwell      Integer  Minutes (10 · 15 · 30 · 45 · 60 · 90)
weather    String   sunny · rainy · cloudy
time       String   morning · afternoon · evening
traffic    String   low · medium · high`}
              </CodeBlock>
              <CodeBlock label="GET /api/track — event types">
{`event=impression    Fires when creative becomes viewable. Revenue logged here.
event=start         Fires when video begins playback.
event=firstQuartile 25% of video viewed.
event=midpoint      50% of video viewed.
event=thirdQuartile 75% of video viewed.
event=complete      Video played to completion.
event=qr_scan       Driver scanned the QR code CTA.

Required params: event, brand, cpm, cb (cache-buster), ts (timestamp)`}
              </CodeBlock>
            </div>

            <H3>data.videoev.com — brand-scoped endpoints</H3>
            <div className="space-y-4">
              <CodeBlock label="GET /api/campaigns">
{`Returns all campaigns for the authenticated brand (Dentsu).
No parameters required. Response is an array of Campaign objects.`}
              </CodeBlock>
              <CodeBlock label="POST /api/campaigns — create a campaign">
{`{
  "sector":         "Luxury",                    // required
  "baseCpm":        55,                          // required, USD
  "videoUrl":       "https://...",               // optional legacy field
  "creativeUrl":    "https://blob.vercel.../",   // preferred — Vercel Blob URL
  "conversionType": "QR_Discount",               // QR_Discount | Lead_Gen | App_Install
  "ctaCopy":        "Scan for exclusive access",
  "targetingRules": {
    "bidMultipliers":   { "rain": 1.0, "lowBattery": 1.0, "weekend": 1.2 },
    "targetAffinities": ["affluent", "high_net_worth", "luxury_buyer"]
  }
}
// brandName is ALWAYS locked server-side — cannot be set by client`}
              </CodeBlock>
              <CodeBlock label="GET /api/predict-bid — audience revenue simulation">
{`?segment=luxury_auto        Porsche, Maserati, Bentley owners
?segment=high_hhi           MSRP $100k+ vehicles
?segment=tech_early_adopter Tesla, Rivian, Polestar owners
?segment=outdoor_adventure  Rivian, Ford Bronco, Jeep owners
?segment=business_traveler  Airport / office park venue sessions
?segment=all                Entire audience pool

Response: { matchedVehicles, matchRate, monthlyImpressions,
            effectiveCpm, estimatedMonthlyRevenue, confidence,
            affinityTags, breakdown }`}
              </CodeBlock>
              <CodeBlock label="POST /api/vehicles — OCPP hardware ingest">
{`{
  "sessionId":    "CHG-2026-03-31-001",   // unique per charging session
  "make":         "Tesla",
  "model":        "Model S",
  "year":         2024,
  "msrp":         89990,
  "batteryPct":   42,
  "chargeKwh":    28.4,
  "dwellMinutes": 31,
  "venue":        "luxury_retail"
}

// Upsert by sessionId — safe to send mid-session updates
// ?seed=1  →  generates 40 test VehicleProfile rows`}
              </CodeBlock>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-8 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="#2dd4bf"/>
                <circle cx="8" cy="8" r="6" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.3"/>
              </svg>
              <span className="text-xs text-white/25">VideoEV Platform Docs · v1.0 · 2026</span>
            </div>
            <a href="/marketing/mission-control"
              className="text-xs text-white/25 hover:text-teal-400 transition-colors">
              ← Mission Control
            </a>
          </footer>

        </main>
      </div>
    </div>
  );
}
