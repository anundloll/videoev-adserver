'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ConversionType } from '@/lib/ad-generator';

// ─── Constants ────────────────────────────────────────────────────────────────

const S3 = 'https://videoev.s3.us-east-1.amazonaws.com';

const SECTORS = [
  'Financial', 'Luxury', 'Pharma', 'Legal', 'Home Services',
  'Furniture', 'Travel', 'Insurance', 'QSR', 'Automotive', 'Grocery', 'Tech',
];

// ─── Multiplier Signal / Condition mapping ────────────────────────────────────

type SignalKey = 'weather' | 'battery' | 'day' | 'msrp' | 'venue';

const SIGNAL_META: Record<SignalKey, { label: string; conditions: { value: string; label: string }[] }> = {
  weather: { label: 'Weather',       conditions: [{ value: 'rain',     label: 'Rainy' }] },
  battery: { label: 'Battery Level', conditions: [{ value: 'lowBat',   label: '< 20%' }] },
  day:     { label: 'Day Type',      conditions: [{ value: 'weekend',  label: 'Weekend' }] },
  msrp:    {
    label: 'MSRP',
    conditions: [
      { value: 'msrp_60k',  label: '> $60k' },
      { value: 'msrp_100k', label: '> $100k' },
      { value: 'msrp_200k', label: '> $200k' },
    ],
  },
  venue: {
    label: 'Venue',
    conditions: [
      { value: 'venue_luxury',   label: 'Luxury Retail' },
      { value: 'venue_airport',  label: 'Airport' },
      { value: 'venue_mall',     label: 'Mall' },
      { value: 'venue_hospital', label: 'Hospital' },
    ],
  },
};

type MultiplierField = 'rain' | 'lowBattery' | 'weekend';
const MULTIPLIER_FIELD_MAP: Record<string, MultiplierField> = {
  'weather:rain':   'rain',
  'battery:lowBat': 'lowBattery',
  'day:weekend':    'weekend',
};

const AFFINITY_TAG_MAP: Record<string, string[]> = {
  'msrp:msrp_60k':       ['affluent'],
  'msrp:msrp_100k':      ['high_net_worth', 'affluent'],
  'msrp:msrp_200k':      ['ultra_luxury', 'high_net_worth'],
  'venue:venue_luxury':  ['luxury_buyer', 'affluent'],
  'venue:venue_airport': ['traveler', 'business_class'],
  'venue:venue_mall':    ['shopper', 'family'],
  'venue:venue_hospital':['health_conscious'],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DbCampaign = {
  id:             string;
  brandName:      string;
  sector:         string;
  baseCpm:        number;
  videoUrl:       string;
  conversionType: string;
  ctaCopy:        string;
  targetingRules: {
    bidMultipliers: { rain: number; lowBattery: number; weekend: number };
    targetAffinities: string[];
  };
  isActive:    boolean;
  createdAt:   string;
  _count:      { trackingEvents: number };
};

type Rule = { id: number; signal: SignalKey | ''; condition: string; multiplier: string };

const DEFAULT_FORM = {
  brand:           '',
  sector:          'Financial',
  videoUrl:        '',
  baseCpm:         '35',
  conversionType:  'QR_Discount' as ConversionType,
  conversionValue: '',
  affinities:      '',
};

let ruleIdCounter = 0;

// ─── Syntax Highlighter ───────────────────────────────────────────────────────

function SyntaxHighlight({ json }: { json: string }) {
  const tokens = json.split(/(\"(?:[^\"\\]|\\.)*\"(?:\s*:)?|true|false|null|-?\d+\.?\d*)/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (/^"[^"]*"\s*:/.test(tok))        return <span key={i} className="text-teal-400">{tok}</span>;
        if (/^"/.test(tok))                   return <span key={i} className="text-amber-300">{tok}</span>;
        if (/^-?\d/.test(tok))               return <span key={i} className="text-violet-400">{tok}</span>;
        if (/^(true|false|null)$/.test(tok))  return <span key={i} className="text-sky-400">{tok}</span>;
        return <span key={i} className="text-slate-500">{tok}</span>;
      })}
    </>
  );
}

// ─── Kiosk Creative Preview ───────────────────────────────────────────────────

function CreativePreview({ brand, cta, sector, videoUrl }: {
  brand: string; cta: string; sector: string; videoUrl?: string;
}) {
  const displayBrand = brand.trim() || 'Brand Name';
  const displayCta   = cta.trim()   || 'Scan to learn more';
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    if (hovered) {
      v.currentTime = 0;
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered, videoUrl]);

  const gradients: Record<string, string> = {
    Luxury:     'from-amber-950 to-slate-950',
    Travel:     'from-sky-950 to-slate-950',
    Financial:  'from-emerald-950 to-slate-950',
    Tech:       'from-violet-950 to-slate-950',
    Automotive: 'from-blue-950 to-slate-950',
    Pharma:     'from-cyan-950 to-slate-950',
    Insurance:  'from-indigo-950 to-slate-950',
  };
  const gradient = gradients[sector] ?? 'from-slate-800 to-slate-950';

  return (
    <div className="p-4">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Live Preview</p>

      {/* 16:9 kiosk frame */}
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700/40 bg-slate-950 shadow-xl shadow-black/50 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        {/* Real video background (when URL is set) */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            loop
            preload="metadata"
          />
        )}

        {/* Gradient fallback (shown when no video or video not yet playing) */}
        {(!videoUrl || !hovered) && (
          <div className={`absolute inset-0 bg-gradient-to-b ${gradient} ${videoUrl && hovered ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
        )}
        {!videoUrl && (
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)', backgroundSize: '100% 6px' }}
          />
        )}

        {/* Play/hover hint */}
        {!hovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white/20 ml-1" />
            </div>
          </div>
        )}

        {/* Sound playing badge */}
        {videoUrl && hovered && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-[8px] font-semibold text-teal-300">🔊 Playing</span>
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-bold tracking-widest text-white/60 uppercase">Live</span>
        </div>

        {/* VideoEV badge — hidden while audio is playing */}
        {!(videoUrl && hovered) && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="text-[8px] font-semibold text-teal-400 tracking-wide">VideoEV</span>
          </div>
        )}

        {/* Ad overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8 px-4 pb-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] text-teal-400/70 uppercase tracking-widest mb-0.5">{sector}</p>
              <p className="text-sm font-bold text-white truncate leading-tight">{displayBrand}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{displayCta}</p>
            </div>
            {/* QR placeholder */}
            <div className="shrink-0 w-9 h-9 bg-white rounded p-0.5">
              <svg viewBox="0 0 21 21" className="w-full h-full">
                <rect x="1" y="1" width="7" height="7" fill="none" stroke="black" strokeWidth="1.2"/>
                <rect x="3" y="3" width="3" height="3" fill="black"/>
                <rect x="13" y="1" width="7" height="7" fill="none" stroke="black" strokeWidth="1.2"/>
                <rect x="15" y="3" width="3" height="3" fill="black"/>
                <rect x="1" y="13" width="7" height="7" fill="none" stroke="black" strokeWidth="1.2"/>
                <rect x="3" y="15" width="3" height="3" fill="black"/>
                <rect x="10" y="10" width="2" height="2" fill="black"/>
                <rect x="13" y="10" width="2" height="2" fill="black"/>
                <rect x="16" y="10" width="2" height="2" fill="black"/>
                <rect x="10" y="13" width="2" height="2" fill="black"/>
                <rect x="13" y="15" width="2" height="2" fill="black"/>
                <rect x="16" y="13" width="2" height="2" fill="black"/>
                <rect x="10" y="16" width="2" height="2" fill="black"/>
                <rect x="16" y="16" width="2" height="2" fill="black"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Charging progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-800">
          <div className="h-full w-2/3 bg-teal-500/50" />
        </div>
      </div>

      <p className="text-[10px] text-slate-600 mt-2.5 text-center">
        {videoUrl ? 'Hover to play with sound · 16:9 kiosk format' : 'Updates as you type · 16:9 kiosk format'}
      </p>
    </div>
  );
}

// ─── Reach Estimator ─────────────────────────────────────────────────────────

function ReachEstimator({ rules, baseCpm, affinities }: {
  rules: Rule[];
  baseCpm: string;
  affinities: string;
}) {
  const activeRules  = rules.filter(r => r.signal && r.condition).length;
  const cpmVal       = parseFloat(baseCpm) || 35;
  const affinityCount = affinities.split(',').map(s => s.trim()).filter(Boolean).length;
  const totalRules   = activeRules + Math.min(affinityCount, 3);

  const base      = 52000;
  const estimated = Math.round(base * Math.pow(0.72, totalRules));
  const monthlyRev = Math.round((estimated / 1000) * cpmVal);

  const coverage      = totalRules === 0 ? 'Broad Reach' : totalRules <= 2 ? 'Moderate' : 'Targeted';
  const coverageColor = totalRules === 0 ? 'text-teal-400' : totalRules <= 2 ? 'text-amber-400' : 'text-violet-400';
  const barWidth      = `${Math.max(8, Math.round((estimated / base) * 100))}%`;

  function fmt(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="eyebrow text-slate-400">Reach Estimator</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Based on 847 active sessions / day</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          totalRules === 0
            ? 'border-teal-800/40 bg-teal-900/20 text-teal-400'
            : totalRules <= 2
            ? 'border-amber-800/40 bg-amber-900/20 text-amber-400'
            : 'border-violet-800/40 bg-violet-900/20 text-violet-400'
        }`}>{coverage}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Mo. Impressions</p>
          <p className="text-2xl font-bold num text-white">{fmt(estimated)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">CPM</p>
          <p className="text-2xl font-bold num text-teal-400">${cpmVal.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Est. Mo. Rev</p>
          <p className="text-2xl font-bold num text-white">${fmt(monthlyRev)}</p>
        </div>
      </div>

      {/* Audience reach bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
          <span>Audience reach</span>
          <span className={coverageColor}>{Math.round((estimated / base) * 100)}% of network</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalRules === 0 ? 'bg-teal-500' : totalRules <= 2 ? 'bg-amber-500' : 'bg-violet-500'
            }`}
            style={{ width: barWidth }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'campaigns' as const, label: 'Campaigns',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { id: 'assets' as const, label: 'Assets',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M4.5 7L6.5 5L8 6.5L9.5 5L11 7" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1.1"/></svg> },
  { id: 'analytics' as const, label: 'Analytics',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10.5L5 7L7.5 9L11 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="4.5" r="1.5" fill="currentColor"/></svg> },
];

export default function CampaignAdminPage() {
  const [form, setForm]           = useState(DEFAULT_FORM);
  const [rules, setRules]         = useState<Rule[]>([
    { id: ++ruleIdCounter, signal: '', condition: '', multiplier: '1.3' },
  ]);
  const [campaigns, setCampaigns] = useState<DbCampaign[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [inspected, setInspected] = useState<DbCampaign | null>(null);
  const [copied, setCopied]       = useState(false);
  const [search, setSearch]       = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [previewTab, setPreviewTab] = useState<'preview' | 'json'>('preview');
  const [navSection, setNavSection] = useState<'campaigns' | 'assets' | 'analytics'>('campaigns');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch campaigns ─────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setLoadState('loading');
    try {
      const res  = await fetch('/admin/api/campaigns');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCampaigns(data);
      setLoadState('ok');
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setLoadState('error');
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = campaigns;
    if (sectorFilter) list = list.filter(c => c.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.brandName.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q));
    }
    return list;
  }, [campaigns, search, sectorFilter]);

  // ── Rule helpers ────────────────────────────────────────────────────────────
  function addRule() {
    setRules(r => [...r, { id: ++ruleIdCounter, signal: '', condition: '', multiplier: '1.3' }]);
  }
  function removeRule(id: number) {
    setRules(r => r.filter(r => r.id !== id));
  }
  function updateRule(id: number, field: keyof Rule, value: string) {
    setRules(r => r.map(rule => {
      if (rule.id !== id) return rule;
      if (field === 'signal') return { ...rule, signal: value as SignalKey | '', condition: '' };
      return { ...rule, [field]: value };
    }));
  }

  // ── Build targeting rules payload ──────────────────────────────────────────
  function buildTargetingRules() {
    const bidMultipliers = { rain: 1.0, lowBattery: 1.0, weekend: 1.0 };
    const affinitySet = new Set<string>();

    form.affinities.split(',').map(s => s.trim()).filter(Boolean).forEach(t => affinitySet.add(t));

    for (const rule of rules) {
      if (!rule.signal || !rule.condition) continue;
      const key    = `${rule.signal}:${rule.condition}`;
      const mField = MULTIPLIER_FIELD_MAP[key];
      if (mField) bidMultipliers[mField] = parseFloat(rule.multiplier) || 1.0;
      AFFINITY_TAG_MAP[key]?.forEach(t => affinitySet.add(t));
    }

    return {
      bidMultipliers,
      targetAffinities: Array.from(affinitySet).slice(0, 6),
    };
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.brand.trim()) return;
    setSaving(true);
    setSaveError(null);

    const brandSlug = form.brand.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const payload = {
      brandName:      form.brand.trim(),
      sector:         form.sector,
      baseCpm:        parseFloat(form.baseCpm) || 35,
      videoUrl:       form.videoUrl.trim() || `${S3}/placeholder_${brandSlug}.mp4`,
      conversionType: form.conversionType,
      ctaCopy:        form.conversionValue,
      targetingRules: buildTargetingRules(),
    };

    try {
      const res = await fetch('/admin/api/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const created: DbCampaign = await res.json();
      setCampaigns(prev => [created, ...prev]);
      setGeneratedJson(JSON.stringify(created, null, 2));
      setInspected(created);
      setPreviewTab('json');
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!generatedJson) return;
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isAffinitySignal = (signal: string, condition: string) =>
    !!(signal && condition && AFFINITY_TAG_MAP[`${signal}:${condition}`]);

  // ── Input class helper ──────────────────────────────────────────────────────
  const input = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-600/80 focus:bg-slate-900 transition-colors';
  const select = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600/80 transition-colors';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-slate-800/80 px-4 lg:px-5 py-3.5 flex items-center gap-3 bg-slate-950/95 backdrop-blur-sm">
        <button
          className="lg:hidden text-slate-500 hover:text-white transition-colors p-1"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="eyebrow text-slate-500 hidden sm:block">VideoEV AdCP</span>
          <span className="text-slate-700 hidden sm:block">/</span>
          <span className="text-sm font-semibold capitalize">{navSection}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {loadState === 'ok' && (
            <span className="text-xs text-slate-600 num hidden sm:block">{campaigns.length} campaigns in DB</span>
          )}
          {loadState === 'error' && (
            <span className="text-xs text-red-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              DB offline
            </span>
          )}
          {loadState === 'loading' && (
            <span className="text-xs text-slate-600">Loading…</span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className={`
          absolute lg:relative z-20 h-full
          w-64 lg:w-56 xl:w-60 shrink-0
          border-r border-slate-800/80 bg-slate-950
          flex flex-col
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Navigation */}
          <nav className="p-2 border-b border-slate-800/80 space-y-0.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setNavSection(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors
                  ${navSection === item.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }
                `}
              >
                <span className={navSection === item.id ? 'text-teal-400' : 'text-slate-600'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {item.id !== 'campaigns' && (
                  <span className="ml-auto text-[9px] text-slate-700 uppercase tracking-wide font-medium">Soon</span>
                )}
              </button>
            ))}
          </nav>

          {/* Campaign list */}
          {navSection === 'campaigns' && (
            <>
              <div className="p-2.5 border-b border-slate-800/80 space-y-2">
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm placeholder-slate-600 focus:outline-none focus:border-teal-600/80 transition-colors"
                />
                <select
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-teal-600/80 transition-colors"
                >
                  <option value="">All sectors</option>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadState === 'loading' && (
                  <div className="p-4 text-xs text-slate-600 text-center">Loading…</div>
                )}
                {loadState === 'error' && (
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-red-400">Could not connect to database.</p>
                    <button onClick={loadCampaigns} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">Retry</button>
                  </div>
                )}
                {loadState === 'ok' && filtered.length === 0 && (
                  <div className="p-4 text-xs text-slate-600">No campaigns yet.</div>
                )}
                {filtered.map(c => {
                  const isActive = inspected?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setInspected(isActive ? null : c); setPreviewTab('json'); setSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 border-b border-slate-800/40 hover:bg-slate-900/60 transition-colors ${
                        isActive ? 'bg-slate-900 border-l-2 border-l-teal-500 pl-2.5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium truncate">{c.brandName}</span>
                        <span className="text-xs text-teal-400 num shrink-0">${c.baseCpm}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] text-slate-500">{c.sector}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${c.isActive ? 'bg-teal-900/40 text-teal-400' : 'bg-slate-800 text-slate-500'}`}>
                          {c.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {navSection !== 'campaigns' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-xs text-slate-600 text-center leading-relaxed">
                {navSection === 'assets' ? 'Video asset library' : 'Performance analytics'}<br />
                <span className="text-slate-700 mt-1 block">Coming soon</span>
              </p>
            </div>
          )}
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-10 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Center: Form ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl px-6 lg:px-8 py-8">

            <div className="mb-8">
              <h1 className="text-xl font-semibold">New Campaign</h1>
              <p className="text-xs text-slate-500 mt-1">Saved campaigns enter the live auction engine immediately.</p>
            </div>

            {/* Basic Info */}
            <fieldset className="mb-8">
              <legend className="eyebrow text-slate-400 mb-4">Basic Info</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Brand / Campaign Name</label>
                  <input type="text" value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g. Rolex" className={input} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Sector</label>
                  <select value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    className={select}>
                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Base CPM ($)</label>
                  <input type="number" value={form.baseCpm}
                    onChange={e => setForm(f => ({ ...f, baseCpm: e.target.value }))}
                    step="0.5" min="1" className={input} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Video Asset URL</label>
                  <input type="text" value={form.videoUrl}
                    onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="Leave blank → S3 placeholder" className={input} />
                </div>
              </div>
            </fieldset>

            {/* Conversion Goal */}
            <fieldset className="mb-8">
              <legend className="eyebrow text-slate-400 mb-4">Conversion Goal</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Type</label>
                  <select value={form.conversionType}
                    onChange={e => setForm(f => ({ ...f, conversionType: e.target.value as ConversionType }))}
                    className={select}>
                    <option value="QR_Discount">QR Discount</option>
                    <option value="Lead_Gen">Lead Gen</option>
                    <option value="App_Install">App Install</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">CTA Copy</label>
                  <input type="text" value={form.conversionValue}
                    onChange={e => setForm(f => ({ ...f, conversionValue: e.target.value }))}
                    placeholder="e.g. Scan for 10% off" className={input} />
                </div>
              </div>
            </fieldset>

            {/* Targeting Multipliers */}
            <fieldset className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <legend className="eyebrow text-slate-400">Targeting Multipliers</legend>
                <button type="button" onClick={addRule}
                  className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors px-2.5 py-1.5 rounded-lg border border-teal-900/40 hover:border-teal-800/60 bg-teal-950/20 hover:bg-teal-950/40">
                  <span className="text-sm leading-none font-medium">+</span> Add Rule
                </button>
              </div>

              <div className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 mb-2 px-1">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Signal</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Condition</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Value</span>
                <span />
              </div>

              <div className="space-y-2">
                {rules.map(rule => {
                  const key = `${rule.signal}:${rule.condition}`;
                  const isAffinity = isAffinitySignal(rule.signal, rule.condition);
                  const affinityTags = AFFINITY_TAG_MAP[key] ?? [];
                  return (
                    <div key={rule.id} className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 items-center">
                      <select value={rule.signal}
                        onChange={e => updateRule(rule.id, 'signal', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600/80 transition-colors">
                        <option value="">Signal…</option>
                        {Object.entries(SIGNAL_META).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <select value={rule.condition}
                        onChange={e => updateRule(rule.id, 'condition', e.target.value)}
                        disabled={!rule.signal}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600/80 disabled:opacity-40 transition-colors">
                        <option value="">Condition…</option>
                        {rule.signal && SIGNAL_META[rule.signal]?.conditions.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {isAffinity ? (
                        <div className="flex flex-wrap gap-1 py-1">
                          {affinityTags.map(t => (
                            <span key={t} className="text-[9px] bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded-md">{t}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input type="number" value={rule.multiplier}
                            onChange={e => updateRule(rule.id, 'multiplier', e.target.value)}
                            step="0.05" min="0.5" max="5"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-teal-600/80 transition-colors" />
                          <span className="text-xs text-slate-600 shrink-0">×</span>
                        </div>
                      )}
                      <button type="button" onClick={() => removeRule(rule.id)}
                        className="text-slate-700 hover:text-red-500 transition-colors text-base leading-none flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-600 mt-3">
                Weather / Battery / Day → sets <code className="text-slate-400">bidMultipliers</code>.
                MSRP / Venue → injects affinity tags (+10 auction score each).
              </p>
            </fieldset>

            {/* Target Affinities */}
            <fieldset className="mb-8">
              <legend className="eyebrow text-slate-400 mb-4">Additional Target Affinities</legend>
              <input type="text" value={form.affinities}
                onChange={e => setForm(f => ({ ...f, affinities: e.target.value }))}
                placeholder="high_net_worth, affluent, urban (comma-separated)"
                className={input} />
              <p className="text-[11px] text-slate-600 mt-2">
                Merged with tags from multiplier rules above. Max 6 total affinities.
              </p>
            </fieldset>

            {/* Reach Estimator */}
            <ReachEstimator rules={rules} baseCpm={form.baseCpm} affinities={form.affinities} />

            {saveError && (
              <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <span className="text-red-500">⚠</span> {saveError}
              </div>
            )}

            <button type="button" onClick={handleSave}
              disabled={!form.brand.trim() || saving}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-colors shadow-lg shadow-teal-900/20">
              {saving ? 'Saving…' : 'Save Campaign to Database'}
            </button>

          </div>
        </main>

        {/* ── Right: Preview + JSON ─────────────────────────────────────────── */}
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 border-l border-slate-800/80 flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-800/80 shrink-0">
            {(['preview', 'json'] as const).map(tab => (
              <button key={tab} onClick={() => setPreviewTab(tab)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  previewTab === tab
                    ? 'text-white border-b-2 border-teal-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab === 'preview' ? 'Creative Preview' : 'Generated JSON'}
              </button>
            ))}
          </div>

          {/* Preview tab */}
          {previewTab === 'preview' && (
            <div className="flex-1 overflow-y-auto">
              <CreativePreview brand={form.brand} cta={form.conversionValue} sector={form.sector} videoUrl={form.videoUrl || undefined} />
            </div>
          )}

          {/* JSON tab */}
          {previewTab === 'json' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Output</span>
                {generatedJson && (
                  <button onClick={handleCopy}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {generatedJson ? (
                  <pre className="p-4 text-xs leading-5 font-mono whitespace-pre-wrap break-all">
                    <SyntaxHighlight json={generatedJson} />
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <p className="text-xs text-slate-600 text-center leading-relaxed">
                      Fill the form and click<br />
                      <span className="text-slate-500 font-medium">Save Campaign</span><br />
                      to write to the database.
                    </p>
                  </div>
                )}
              </div>

              {inspected && (
                <div className="border-t border-slate-800 flex flex-col max-h-64 shrink-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 shrink-0">
                    <span className="eyebrow text-slate-400 truncate mr-2">Inspect · {inspected.brandName}</span>
                    <button onClick={() => setInspected(null)} className="text-slate-600 hover:text-slate-400 transition-colors text-sm shrink-0">×</button>
                  </div>
                  <pre className="overflow-y-auto p-4 text-[11px] leading-4 font-mono whitespace-pre-wrap break-all">
                    <SyntaxHighlight json={JSON.stringify(inspected, null, 2)} />
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
