"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Telemetry {
  msrp: string;    // "120k+" | "40k-80k"
  battery: number; // 0–100
  weather: string; // "sunny" | "rainy"
}

export interface VideoEVPlayerProps {
  cpoName: string;
  accentColor: string; // hex e.g. "#22b4e8"
  logoUrl?: string;
  stationId: string;
  telemetry: Telemetry;
  adDecisionUrl?: string;
}

interface AdData {
  videoUrl: string;
  brand: string;
  cpm: string;
  qrCodeUrl: string;
  conversionType: string;
}

// ─── VAST Fetcher ─────────────────────────────────────────────────────────────

async function fetchAdFromVAST(
  decisionUrl: string,
  telemetry: Telemetry,
): Promise<AdData | null> {
  const params = new URLSearchParams({
    car_make: "tesla",
    msrp: telemetry.msrp,
    battery: String(telemetry.battery),
    weather: telemetry.weather,
    venue: telemetry.msrp === "120k+" ? "luxury_retail" : "mall",
    location: "suburban",
    dwell: "45",
    time: "morning",
    traffic: telemetry.battery < 20 ? "high" : "low",
    current_bid: "200",
  });

  try {
    const res = await fetch(`${decisionUrl}?${params}`);
    if (!res.ok) return null;
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const conversionEl = doc.querySelector("Conversion");
    return {
      videoUrl: doc.querySelector("MediaFile")?.textContent?.trim() ?? "",
      brand:    doc.querySelector("Brand")?.textContent?.trim() ?? "",
      cpm:      doc.querySelector("CPM")?.textContent?.trim() ?? "",
      qrCodeUrl:     conversionEl?.querySelector("QRCodeUrl")?.textContent?.trim() ?? "",
      conversionType: conversionEl?.querySelector("Type")?.textContent?.trim() ?? "Lead_Gen",
    };
  } catch {
    return null;
  }
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoEVPlayer({
  cpoName,
  accentColor,
  logoUrl,
  stationId,
  telemetry,
  adDecisionUrl = "https://ads.videoev.com/api/decision",
}: VideoEVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [adData, setAdData]       = useState<AdData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [muted, setMuted]         = useState(true);
  const [volume, setVolume]       = useState(0.8);

  // Re-fetch ad whenever telemetry changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setCurrentTime(0);
    setDuration(0);

    fetchAdFromVAST(adDecisionUrl, telemetry).then((data) => {
      if (cancelled) return;
      if (!data) { setError(true); setLoading(false); return; }
      setAdData(data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry.msrp, telemetry.battery, telemetry.weather, adDecisionUrl]);

  // Load + play video whenever the resolved URL changes
  useEffect(() => {
    if (!adData?.videoUrl || !videoRef.current) return;
    const v = videoRef.current;
    v.src = adData.videoUrl;
    v.load();
    v.play().catch(() => {});
  }, [adData?.videoUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      videoRef.current.currentTime = ratio * duration;
    },
    [duration],
  );

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    if (!next && videoRef.current.volume === 0) {
      videoRef.current.volume = 0.5;
      setVolume(0.5);
    }
    setMuted(next);
  }, [muted]);

  return (
    <div className="rounded-xl overflow-hidden bg-gray-950 shadow-2xl select-none">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={cpoName}
              className="h-6 max-w-[90px] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span className="text-white font-semibold text-sm truncate">{cpoName}</span>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-gray-500 text-xs font-mono">{stationId}</span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold tracking-widest"
            style={{ backgroundColor: accentColor, color: "#000" }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* ── Video ── */}
      <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
            <div
              className="w-7 h-7 rounded-full border-2 border-gray-800 animate-spin"
              style={{ borderTopColor: accentColor }}
            />
            <span className="text-gray-500 text-xs">Matching best ad…</span>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <span className="text-gray-500 text-xs">Unable to load ad</span>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted={muted}
          loop
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
        />

        {/* Brand overlay */}
        {adData && !loading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white font-semibold text-sm leading-tight">{adData.brand}</div>
                <div className="text-gray-400 text-xs">${adData.cpm} CPM</div>
              </div>
              <div className="text-[10px] text-gray-500 italic">VideoEV AdCP</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div
        className="relative h-1 bg-gray-800 cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            backgroundColor: accentColor,
            transition: "width 0.25s linear",
          }}
        />
        {/* Scrub handle */}
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          style={{ left: `${progress}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-950">
        <button
          onClick={toggleMute}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 cursor-pointer"
          style={{ accentColor }}
        />

        <div className="flex-1" />

        <span className="text-gray-600 text-xs font-mono num">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>

      {/* ── QR + Branding footer ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800/60">
        {/* QR code — accent-colored border */}
        <div
          className="flex-shrink-0 p-1 rounded-lg"
          style={{ border: `2px solid ${accentColor}` }}
        >
          {adData?.qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={adData.qrCodeUrl}
              alt="Scan to convert"
              className="w-14 h-14 rounded"
            />
          ) : (
            <div className="w-14 h-14 bg-gray-800/80 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold">Scan to Learn More</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {adData?.conversionType?.replace(/_/g, " ") ?? "Loading…"}
          </div>
        </div>

        {/* "Powered by VideoEV" watermark */}
        <div className="text-right flex-shrink-0">
          <div className="text-gray-600 text-[10px] uppercase tracking-wider">Powered by</div>
          <div className="text-gray-300 text-xs font-semibold">VideoEV</div>
        </div>
      </div>
    </div>
  );
}
