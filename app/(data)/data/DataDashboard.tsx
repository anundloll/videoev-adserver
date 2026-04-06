'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { upload } from '@vercel/blob/client';

// ─── Types (exported — consumed by page.tsx) ──────────────────────────────────

export type PulseDay  = { date: string; count: number };
export type MakeStat  = { make: string; count: number };
export type MsrpTier  = { tier: string; label: string; count: number };
export type CampaignRow = {
  id:             string;
  brandName:      string;
  sector:         string;
  baseCpm:        number;
  isActive:       boolean;
  conversionType: string;
  ctaCopy:        string;
  createdAt:      string;
  eventCount:     number;
};
export type WorkspaceData = {
  brand:           string;
  isLive:          boolean;
  lastEventAt:     string | null;
  totalPlays:      number;
  qrScans:         number;
  totalSpend:      number;
  completionRate:  number;
  pulse:           PulseDay[];
  lastRefreshed:   string;
  uniqueVehicles:  number;
  avgDwellMinutes: number;
  vehicleMakes:    MakeStat[];
  msrpTiers:       MsrpTier[];
  hasVehicleData:  boolean;
  campaigns:       CampaignRow[];
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SECTORS = [
  'Financial', 'Luxury', 'Pharma', 'Legal', 'Home Services',
  'Furniture', 'Travel', 'Insurance', 'QSR', 'Automotive', 'Grocery', 'Tech',
];

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
       : n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`
       : String(n);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-3xl font-bold num tracking-tight ${accent ? 'text-teal-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-600 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Pulse chart ─────────────────────────────────────────────────────────────

function PulseChart({ pulse }: { pulse: PulseDay[] }) {
  const max    = Math.max(...pulse.map(d => d.count), 1);
  const barW   = 14;
  const gap    = 4;
  const chartH = 72;
  const totalW = (barW + gap) * 30 - gap;
  const label  = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <svg viewBox={`0 0 ${totalW} ${chartH}`} preserveAspectRatio="none"
        className="w-full h-20" aria-label="30-day impression trend">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="1" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {pulse.map((day, i) => {
          const h = Math.max(3, (day.count / max) * (chartH - 6));
          return (
            <rect key={day.date} x={i * (barW + gap)} y={chartH - h}
              width={barW} height={h} rx="2"
              fill={day.count > 0 ? 'url(#barGrad)' : '#1e293b'} />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-slate-600">
        <span>{pulse[0]  ? label(pulse[0].date)  : ''}</span>
        <span>{pulse[14] ? label(pulse[14].date) : ''}</span>
        <span>{pulse[29] ? label(pulse[29].date) : ''}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Performance Overview</h2>
        <p className="text-xs text-slate-500 mt-1">
          Filtered to <span className="text-white font-medium">{d.brand}</span> campaigns · Last 30 days
        </p>
      </div>

      {/* 6-card grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Plays"       value={fmt(d.totalPlays)}     sub="Verified impressions" />
        <StatCard label="QR Scans"          value={fmt(d.qrScans)}
          sub={d.totalPlays > 0 ? `${((d.qrScans / d.totalPlays) * 100).toFixed(1)}% scan rate` : '—'}
          accent />
        <StatCard label="Total Spend"
          value={`$${d.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Across all campaigns" />
        <StatCard label="Completion Rate"   value={`${d.completionRate.toFixed(1)}%`}
          sub="Played to end"        accent={d.completionRate >= 70} />
        <StatCard label="Unique Vehicles"   value={fmt(d.uniqueVehicles)}
          sub={d.hasVehicleData ? 'From OCPP telemetry' : 'From session IDs'} />
        <StatCard label="Avg Dwell Time"    value={`${d.avgDwellMinutes} min`}
          sub={d.hasVehicleData ? 'Hardware-verified' : 'EV industry baseline'} accent />
      </div>

      {/* Pulse chart */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow text-slate-400">Plays — 30D Pulse</p>
            <p className="text-[11px] text-slate-600 mt-1">Daily impression count</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
            <span className="text-[11px] text-slate-500">Impressions</span>
          </div>
        </div>
        <PulseChart pulse={d.pulse} />
      </div>

      {d.totalPlays === 0 && (
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 p-10 text-center">
          <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-slate-600 text-sm">∅</span>
          </div>
          <p className="text-sm text-slate-500">No events recorded yet for <span className="text-white">{d.brand}</span>.</p>
          <p className="text-[11px] text-slate-700 mt-1">
            Fire an ad request at <code className="text-slate-600">/api/decision</code> to generate tracking data.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — AUDIENCE & IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

type PredictResult = {
  segment: string;
  matchedVehicles: number;
  matchRate: number;
  monthlyImpressions: number;
  effectiveCpm: number;
  estimatedMonthlyRevenue: number;
  confidence: string;
  affinityTags: string[];
  breakdown: { luxuryCount: number; hnwCount: number; avgDwell: number };
  dataSource: string;
};

const SEGMENTS = [
  { key: 'luxury_auto',         label: 'Luxury Auto'          },
  { key: 'high_hhi',            label: 'High HHI ($200k+)'   },
  { key: 'tech_early_adopter',  label: 'Tech Early Adopters' },
  { key: 'outdoor_adventure',   label: 'Outdoor & Adventure' },
  { key: 'business_traveler',   label: 'Business Traveler'   },
  { key: 'all',                 label: 'All Vehicles'        },
];

const COVERAGE_ZONES = [
  { city: 'New York Metro',      level: 'high',   sessions: 2140 },
  { city: 'San Francisco Bay',   level: 'high',   sessions: 1820 },
  { city: 'Los Angeles',         level: 'high',   sessions: 1740 },
  { city: 'Chicago Metro',       level: 'medium', sessions: 1100 },
  { city: 'Washington DC',       level: 'medium', sessions: 890  },
  { city: 'Boston',              level: 'medium', sessions: 720  },
  { city: 'Miami-Dade',          level: 'low',    sessions: 610  },
  { city: 'Dallas-Fort Worth',   level: 'low',    sessions: 540  },
  { city: 'Seattle',             level: 'low',    sessions: 490  },
  { city: 'Denver',              level: 'low',    sessions: 380  },
];

function AudienceTab({ d }: { d: WorkspaceData }) {
  const [segment,        setSegment]        = useState('luxury_auto');
  const [predicting,     setPredicting]     = useState(false);
  const [predictResult,  setPredictResult]  = useState<PredictResult | null>(null);
  const [csvState,       setCsvState]       = useState<'idle' | 'dragging' | 'processing' | 'done'>('idle');
  const [seedState,      setSeedState]      = useState<'idle' | 'seeding' | 'done'>('idle');

  const maxMake   = Math.max(...d.vehicleMakes.map(m => m.count), 1);
  const totalTier = d.msrpTiers.reduce((s, t) => s + t.count, 0) || 1;

  const runPredictBid = useCallback(async () => {
    setPredicting(true);
    setPredictResult(null);
    try {
      const res = await fetch(`/api/predict-bid?segment=${segment}`);
      if (res.ok) setPredictResult(await res.json());
    } finally {
      setPredicting(false);
    }
  }, [segment]);

  const seedVehicles = async () => {
    setSeedState('seeding');
    await fetch('/api/vehicles?seed=1', { method: 'POST' });
    setSeedState('done');
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCsvState('processing');
    setTimeout(() => setCsvState('done'), 2000);
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold">Audience & Identity</h2>
        <p className="text-xs text-slate-500 mt-1">Vehicle intelligence from OCPP hardware telemetry · {d.brand} workspace</p>
      </div>

      {/* Vehicle Intelligence */}
      <section>
        <p className="eyebrow text-slate-400 mb-5">Vehicle Intelligence</p>

        {!d.hasVehicleData ? (
          <div className="rounded-xl border border-slate-800/50 border-dashed bg-slate-900/20 p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">No OCPP telemetry received yet.</p>
            <button
              onClick={seedVehicles}
              disabled={seedState !== 'idle'}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {seedState === 'idle'    ? 'Load Demo Vehicle Data'
               : seedState === 'seeding' ? 'Seeding…'
               : '✓ Done — reloading'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Make breakdown */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Vehicle Make</p>
              <div className="space-y-2.5">
                {d.vehicleMakes.map(m => (
                  <div key={m.make}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{m.make}</span>
                      <span className="text-slate-500 num">{m.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${(m.count / maxMake) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MSRP tiers */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">MSRP Distribution</p>
              <div className="space-y-3">
                {[...d.msrpTiers].reverse().map((t, i) => {
                  const pct = Math.round((t.count / totalTier) * 100);
                  const colors = ['bg-violet-500', 'bg-teal-500', 'bg-amber-500', 'bg-slate-600'];
                  return (
                    <div key={t.tier}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{t.tier}</span>
                        <span className="text-slate-500">{t.label} · <span className="num">{pct}%</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${colors[i]} transition-all duration-500`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* PredictBid */}
      <section>
        <p className="eyebrow text-slate-400 mb-5">PredictBid™</p>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1.5">Audience Segment</label>
              <select
                value={segment}
                onChange={e => { setSegment(e.target.value); setPredictResult(null); }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600/80 transition-colors"
              >
                {SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="sm:self-end">
              <button
                onClick={runPredictBid}
                disabled={predicting}
                className="w-full sm:w-auto px-6 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                {predicting ? 'Calculating…' : 'Calculate Estimated Reach'}
              </button>
            </div>
          </div>

          {predictResult && (
            <div className="border-t border-slate-800/60 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Matched Vehicles</p>
                <p className="text-2xl font-bold text-white num">{fmt(predictResult.matchedVehicles)}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{(predictResult.matchRate * 100).toFixed(0)}% of universe</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Mo. Impressions</p>
                <p className="text-2xl font-bold text-teal-400 num">{fmt(predictResult.monthlyImpressions)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Effective CPM</p>
                <p className="text-2xl font-bold text-white num">${predictResult.effectiveCpm}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Est. Mo. Revenue</p>
                <p className="text-2xl font-bold text-white num">${fmt(predictResult.estimatedMonthlyRevenue)}</p>
              </div>
              <div className="col-span-2 sm:col-span-4 flex items-center gap-3 pt-2 border-t border-slate-800/40">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  predictResult.confidence === 'High'
                    ? 'border-teal-800/40 bg-teal-950/30 text-teal-400'
                    : predictResult.confidence === 'Moderate'
                    ? 'border-amber-800/40 bg-amber-950/30 text-amber-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}>{predictResult.confidence} Confidence</span>
                <div className="flex flex-wrap gap-1.5">
                  {predictResult.affinityTags.map(t => (
                    <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <span className="ml-auto text-[10px] text-slate-700 capitalize">
                  Source: {predictResult.dataSource.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Data Upload */}
      <section>
        <p className="eyebrow text-slate-400 mb-5">Audience Data Upload</p>
        <div
          onDragOver={e => { e.preventDefault(); setCsvState('dragging'); }}
          onDragLeave={() => csvState === 'dragging' && setCsvState('idle')}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
            csvState === 'dragging'    ? 'border-teal-500 bg-teal-950/20'
            : csvState === 'processing' ? 'border-amber-700/50 bg-amber-950/10'
            : csvState === 'done'       ? 'border-teal-700/50 bg-teal-950/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
          }`}
        >
          {csvState === 'idle' && (
            <>
              <div className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v10M5 6l4-4 4 4M3 14h12" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-slate-400 font-medium">Drop CSV file here</p>
              <p className="text-[11px] text-slate-600 mt-1">Device IDs, email hashes, or mobile Ad IDs accepted</p>
            </>
          )}
          {csvState === 'processing' && (
            <p className="text-sm text-amber-400">Processing dataset…</p>
          )}
          {csvState === 'done' && (
            <>
              <p className="text-sm text-teal-400 font-medium">✓ Dataset matched</p>
              <p className="text-[11px] text-slate-500 mt-1">Audience segment updated · ready for activation</p>
            </>
          )}
        </div>
      </section>

      {/* Coverage Zones */}
      <section>
        <p className="eyebrow text-slate-400 mb-5">Location Targeting</p>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
          <div className="space-y-3">
            {COVERAGE_ZONES.map(z => {
              const pct = Math.round((z.sessions / 2140) * 100);
              const col = z.level === 'high' ? 'bg-teal-500' : z.level === 'medium' ? 'bg-amber-500' : 'bg-slate-600';
              const badge = z.level === 'high' ? 'text-teal-400 bg-teal-950/30 border-teal-900/30'
                          : z.level === 'medium' ? 'text-amber-400 bg-amber-950/30 border-amber-900/30'
                          : 'text-slate-500 bg-slate-900 border-slate-800';
              return (
                <div key={z.city} className="grid grid-cols-[1fr_auto_80px] gap-3 items-center">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{z.city}</p>
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge} shrink-0`}>
                    {z.level}
                  </span>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${col}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-700 mt-4 text-right">Coverage based on active charging station density</p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Video upload hook ────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function useVideoUpload() {
  const [uploadState,    setUploadState]    = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creativeUrl,    setCreativeUrl]    = useState('');
  const [uploadError,    setUploadError]    = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startUpload = useCallback(async (file: File) => {
    setUploadState('uploading');
    setUploadProgress(0);
    setUploadError('');
    try {
      const blob = await upload(file.name, file, {
        access:          'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: ({ percentage }) => setUploadProgress(percentage),
      });
      setCreativeUrl(blob.url);
      setUploadState('done');
    } catch (err) {
      setUploadError((err as Error).message);
      setUploadState('error');
    }
  }, []);

  const reset = () => { setUploadState('idle'); setUploadProgress(0); setCreativeUrl(''); setUploadError(''); };

  return { uploadState, uploadProgress, creativeUrl, uploadError, fileInputRef, startUpload, reset };
}

// ─── Video preview on hover ───────────────────────────────────────────────────

function VideoPreviewCell({ url }: { url: string }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.currentTime = 0;
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered]);

  return (
    <div
      className="relative w-24 h-14 rounded-lg overflow-hidden bg-slate-800 cursor-pointer shrink-0 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video ref={videoRef} src={url} className="w-full h-full object-cover" playsInline loop />
      {!hovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white/70 ml-0.5" />
          </div>
        </div>
      )}
      {hovered && (
        <div className="absolute bottom-0 inset-x-0 text-center py-0.5 bg-black/50">
          <span className="text-[8px] text-teal-300 font-medium">🔊 Playing</span>
        </div>
      )}
    </div>
  );
}

// ─── Campaign builder ─────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  sector: 'Financial', baseCpm: '35', conversionType: 'QR_Discount', ctaCopy: '',
};

function CampaignsTab({ initial, brand }: { initial: CampaignRow[]; brand: string }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [form,      setForm]      = useState(DEFAULT_FORM);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);

  const { uploadState, uploadProgress, creativeUrl, uploadError, fileInputRef, startUpload, reset: resetUpload } = useVideoUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
  };

  async function submit() {
    setSaving(true); setErr(null);
    try {
      const res = await fetch('/api/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector:         form.sector,
          baseCpm:        parseFloat(form.baseCpm) || 35,
          videoUrl:       creativeUrl || '',
          creativeUrl:    creativeUrl || undefined,
          conversionType: form.conversionType,
          ctaCopy:        form.ctaCopy,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? `HTTP ${res.status}`); }
      const c = await res.json();
      setCampaigns(prev => [{ ...c, eventCount: 0, createdAt: c.createdAt }, ...prev]);
      setForm(DEFAULT_FORM);
      resetUpload();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-600/80 transition-colors';
  const sel = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600/80 transition-colors';

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <p className="text-xs text-slate-500 mt-1">All campaigns locked to <span className="text-white font-medium">{brand}</span> · Changes enter the live auction immediately</p>
      </div>

      {/* Campaign list */}
      {campaigns.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_80px_100px_80px] gap-0 px-4 py-2.5 border-b border-slate-800/80 text-[10px] text-slate-600 uppercase tracking-wider">
            <span className="w-28 mr-3">Creative</span><span>Campaign</span><span>Sector</span><span>CPM</span><span>Status</span>
          </div>
          {campaigns.map(c => (
            <div key={c.id} className="grid grid-cols-[auto_1fr_80px_100px_80px] gap-0 px-4 py-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-900/40 transition-colors items-center">
              <div className="w-28 mr-3">
                {(c as CampaignRow & { creativeUrl?: string }).creativeUrl ? (
                  <VideoPreviewCell url={(c as CampaignRow & { creativeUrl?: string }).creativeUrl!} />
                ) : (
                  <div className="w-24 h-14 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                    <span className="text-[10px] text-slate-600">No asset</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.brandName}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 truncate">{c.ctaCopy || '—'}</p>
              </div>
              <span className="text-xs text-slate-400 self-center">{c.sector}</span>
              <span className="text-xs text-teal-400 num self-center">${c.baseCpm.toFixed(2)}</span>
              <span className={`self-center text-[9px] font-semibold px-2 py-0.5 rounded-full border w-fit ${
                c.isActive ? 'border-teal-900/40 bg-teal-950/30 text-teal-400' : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}>{c.isActive ? 'Active' : 'Paused'}</span>
            </div>
          ))}
        </div>
      )}

      {/* New campaign form */}
      <div>
        <p className="eyebrow text-slate-400 mb-5">New Campaign</p>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 max-w-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Brand (locked)</label>
              <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-500">{brand}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Sector</label>
              <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className={sel}>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Base CPM ($)</label>
              <input type="number" value={form.baseCpm} step="0.5" min="1"
                onChange={e => setForm(f => ({ ...f, baseCpm: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Conversion Type</label>
              <select value={form.conversionType} onChange={e => setForm(f => ({ ...f, conversionType: e.target.value }))} className={sel}>
                <option value="QR_Discount">QR Discount</option>
                <option value="Lead_Gen">Lead Gen</option>
                <option value="App_Install">App Install</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1.5">CTA Copy</label>
              <input type="text" value={form.ctaCopy}
                onChange={e => setForm(f => ({ ...f, ctaCopy: e.target.value }))}
                placeholder="e.g. Scan for 15% off your next purchase" className={inp} />
            </div>

            {/* ── Video Upload ─────────────────────────────────────────────── */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1.5">
                Video Creative
                <span className="text-slate-600 ml-2 font-normal">(MP4 / MOV · up to 500 MB)</span>
              </label>

              {uploadState === 'idle' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-xl border-2 border-dashed border-slate-800 hover:border-teal-700/60 bg-slate-900/30 hover:bg-teal-950/10 p-6 text-center cursor-pointer transition-colors"
                >
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                  <div className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center mx-auto mb-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 5l3-3 3 3M2 12h12" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Click or drag to upload</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Uploaded directly to Vercel Blob · URL saved to creativeUrl</p>
                </div>
              )}

              {uploadState === 'uploading' && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Uploading to Vercel Blob…</span>
                    <span className="text-teal-400 num">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadState === 'done' && (
                <div className="rounded-xl border border-teal-900/40 bg-teal-950/20 p-4 flex items-start gap-3">
                  <VideoPreviewCell url={creativeUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-teal-400 font-medium">✓ Uploaded to Vercel Blob</p>
                    <p className="text-[10px] text-slate-500 mt-1 break-all leading-relaxed">{creativeUrl}</p>
                    <button onClick={resetUpload} className="text-[11px] text-slate-500 hover:text-slate-300 mt-2 transition-colors">
                      Replace
                    </button>
                  </div>
                </div>
              )}

              {uploadState === 'error' && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
                  <p className="text-xs text-red-400">⚠ Upload failed: {uploadError}</p>
                  <button onClick={resetUpload} className="text-[11px] text-slate-400 hover:text-white mt-2 transition-colors">Retry</button>
                </div>
              )}
            </div>
          </div>

          {err && (
            <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2">⚠ {err}</p>
          )}
          {saved && (
            <p className="text-xs text-teal-400">✓ Campaign created and entered the live auction — creativeUrl synced across all portals.</p>
          )}

          <button onClick={submit} disabled={saving || uploadState === 'uploading'}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-colors">
            {saving ? 'Saving…' : 'Launch Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — CREATIVES
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CREATIVES = [
  { id: '1', name: 'Dentsu_Q4_Hero_30s.mp4',    type: 'Video',  size: '42 MB', status: 'Approved',     updated: '2026-03-28' },
  { id: '2', name: 'Dentsu_Spring_15s.mp4',      type: 'Video',  size: '18 MB', status: 'Approved',     updated: '2026-03-20' },
  { id: '3', name: 'Dentsu_Brand_Banner.html',   type: 'HTML5',  size: '3.2 MB', status: 'Under Review', updated: '2026-03-30' },
  { id: '4', name: 'Dentsu_EV_Promo_6s.mp4',    type: 'Video',  size: '8 MB',  status: 'Pending',      updated: '2026-03-31' },
];

type UploadedCreative = {
  id: string; name: string; type: string; size: string;
  status: string; updated: string; blobUrl?: string;
};

function CreativesTab({ brand }: { brand: string }) {
  const [dragging, setDragging]   = useState(false);
  const [uploaded, setUploaded]   = useState<UploadedCreative[]>([]);
  const { uploadState, uploadProgress, creativeUrl, uploadError, fileInputRef, startUpload, reset } = useVideoUpload();

  const processFile = (file: File) => {
    startUpload(file);
  };

  // When an upload finishes, add it to the local list
  useEffect(() => {
    if (uploadState === 'done' && creativeUrl) {
      const filename = creativeUrl.split('/').pop()?.split('?')[0] ?? 'creative.mp4';
      setUploaded(prev => [{
        id:      creativeUrl,
        name:    filename,
        type:    'Video',
        size:    '—',
        status:  'Pending',
        updated: 'Just now',
        blobUrl: creativeUrl,
      }, ...prev]);
      // Brief delay then reset upload state so zone is ready for next file
      setTimeout(reset, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadState, creativeUrl]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const statusStyle = (s: string) => {
    if (s === 'Approved')     return 'text-teal-400 bg-teal-950/30 border-teal-900/40';
    if (s === 'Under Review') return 'text-amber-400 bg-amber-950/30 border-amber-900/40';
    if (s === 'Uploading')    return 'text-sky-400 bg-sky-950/30 border-sky-900/40';
    return 'text-slate-400 bg-slate-900 border-slate-800';  // Pending
  };

  const typeIcon = (t: string) => t === 'Video' ? '▶' : t === 'HTML5' ? '</>' : '□';

  const allCreatives: UploadedCreative[] = [...uploaded, ...MOCK_CREATIVES];
  const isUploading = uploadState === 'uploading';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Creative Library</h2>
        <p className="text-xs text-slate-500 mt-1">{brand} assets · Pending assets are reviewed within 24 hours</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragging   ? 'border-teal-500 bg-teal-950/20'
          : isUploading ? 'border-sky-800 bg-sky-950/10 cursor-not-allowed'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3">
            <p className="text-sm text-sky-400 font-medium">Uploading to Vercel Blob…</p>
            <div className="mx-auto w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600">{uploadProgress}% · Direct to Blob storage · no server buffering</p>
          </div>
        ) : uploadState === 'done' ? (
          <div className="space-y-1">
            <p className="text-sm text-teal-400 font-medium">✓ Uploaded successfully</p>
            <p className="text-[11px] text-slate-600">Click or drop another file to upload more</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2v10M5 6l4-4 4 4M3 14h12" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400 font-medium">Drop video files here or click to browse</p>
            <p className="text-[11px] text-slate-600 mt-1">MP4, MOV, WebM · Max 500 MB · Uploads directly to Vercel Blob</p>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2">⚠ {uploadError}</p>
      )}

      {/* Creative grid */}
      <div className="rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="grid grid-cols-[112px_1fr_80px_80px_100px_100px] gap-0 px-4 py-2.5 border-b border-slate-800/80 text-[10px] text-slate-600 uppercase tracking-wider">
          <span>Preview</span><span>File</span><span>Type</span><span>Size</span><span>Status</span><span>Updated</span>
        </div>
        {allCreatives.map(c => (
          <div key={c.id} className="grid grid-cols-[112px_1fr_80px_80px_100px_100px] gap-0 px-4 py-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-900/30 transition-colors items-center">
            {/* Thumbnail / hover-play */}
            <div className="mr-3 shrink-0">
              {c.blobUrl ? (
                <VideoPreviewCell url={c.blobUrl} />
              ) : (
                <div className="w-24 h-14 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-[10px] text-slate-600">{typeIcon(c.type)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate font-medium">{c.name}</p>
              {c.blobUrl && (
                <p className="text-[9px] text-teal-600 truncate mt-0.5">blob · Vercel</p>
              )}
            </div>
            <span className="text-xs text-slate-500">{c.type}</span>
            <span className="text-xs text-slate-500 num">{c.size}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border w-fit ${statusStyle(c.status)}`}>
              {c.status}
            </span>
            <span className="text-[11px] text-slate-600">{c.updated}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-700">
        Approved creatives are served by the VideoEV ad auction engine. Contact your account manager to expedite review.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKSPACE SHELL
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = 'overview' | 'audience' | 'campaigns' | 'creatives';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview'           },
  { id: 'audience',   label: 'Audience & Identity' },
  { id: 'campaigns',  label: 'Campaigns'           },
  { id: 'creatives',  label: 'Creatives'           },
];

export default function ClientWorkspace({ data: d }: { data: WorkspaceData }) {
  const [tab, setTab] = useState<Tab>('overview');

  const lastEventLabel = d.lastEventAt
    ? `Last event ${new Date(d.lastEventAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : 'No recent events';

  const refreshLabel = new Date(d.lastRefreshed).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center gap-4 bg-slate-950/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-sm font-semibold tracking-tight">VideoEV Data</span>
        </div>
        <div className="h-4 w-px bg-slate-800" />
        <div className="px-3 py-1 rounded-full border border-slate-700/60 bg-slate-900">
          <span className="text-xs font-bold text-white tracking-wide">{d.brand}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
          d.isLive
            ? 'border-teal-900/50 bg-teal-950/40 text-teal-400'
            : 'border-slate-800 bg-slate-900 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${d.isLive ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs font-medium">{d.isLive ? 'Live' : 'Offline'}</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-600">
          <span className="hidden sm:block">{lastEventLabel}</span>
          <span className="hidden md:block">· Refreshed {refreshLabel}</span>
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800/80 px-6 flex gap-1 bg-slate-950/95 sticky top-[61px] z-10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-white border-teal-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {tab === 'overview'  && <OverviewTab  d={d} />}
        {tab === 'audience'  && <AudienceTab  d={d} />}
        {tab === 'campaigns' && <CampaignsTab initial={d.campaigns} brand={d.brand} />}
        {tab === 'creatives' && <CreativesTab brand={d.brand} />}
      </div>

      <footer className="border-t border-slate-800/40 mt-8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60" />
          <span className="text-[11px] text-slate-600">Powered by VideoEV AdNetwork</span>
        </div>
        <span className="text-[11px] text-slate-700">data.videoev.com · {d.brand} Workspace</span>
      </footer>

    </div>
  );
}
