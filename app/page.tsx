"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const VideoAd = dynamic(() => import("@/components/ImaPlayer"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = "start" | "connect" | "auth" | "initiating" | "charging" | "complete";
type AdPhase = "warmup" | "display" | "video_1" | "video_2";

// ─── Data ────────────────────────────────────────────────────────────────────

const S3 = "https://videoev.s3.us-east-1.amazonaws.com";

const VEHICLES = [
  { make: "Tesla",    label: "Tesla Model S",   start: 23, target: 80,  rate: 0.64 },
  { make: "Porsche",  label: "Porsche Taycan",  start: 41, target: 90,  rate: 0.64 },
  { make: "Rivian",   label: "Rivian R1T",      start: 12, target: 100, rate: 0.64 },
  { make: "BMW",      label: "BMW iX",          start: 67, target: 85,  rate: 0.64 },
  { make: "Lucid",    label: "Lucid Air",       start: 55, target: 95,  rate: 0.64 },
  { make: "Volvo",    label: "Volvo EX90",      start: 30, target: 90,  rate: 0.64 },
  { make: "Jaguar",   label: "Jaguar I-Pace",   start: 48, target: 80,  rate: 0.64 },
  { make: "Cadillac", label: "Cadillac Lyriq",  start: 35, target: 95,  rate: 0.64 },
];

// 3 video ads per vehicle: [at ~35% of range, at ~70% of range, completion]
const VIDEO_ADS: Record<string, [string, string, string][]> = {
  tesla: [
    [`${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`, "Apple", "42"],
    [`${S3}/Amazon+Alexa+Super+Bowl+2026+TV+Spot+Chris+Hemsworth+Thinks+Alexa+Is+Scary+Good+-+iSpot.mp4`, "Amazon Alexa", "35"],
    [`${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, "Nike", "38"],
  ],
  porsche: [
    [`${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`, "Capital One", "45"],
    [`${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`, "Oakley", "38"],
    [`${S3}/T-Mobile+TV+Spot+Group+Photo+iPhone+17+15-Minute+Switch+Featuring+Harvey+Guilln+Zoe+Saldaa+Druski+-+iSpot.mp4`, "T-Mobile", "30"],
  ],
  rivian: [
    [`${S3}/Real+Rivian+Adventures+%EF%BD%9C+Saving+Summer.mp4`, "Rivian", "32"],
    [`${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, "Nike", "28"],
    [`${S3}/T-Mobile+Home+Internet+TV+Spot+Treadmill+30+per+Month+Featuring+Zach+Braff+Donald+Faison+-+iSpot.mp4`, "T-Mobile Home", "25"],
  ],
  bmw: [
    [`${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`, "Oakley", "38"],
    [`${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`, "Capital One", "35"],
    [`${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, "Nike", "32"],
  ],
  lucid: [
    [`${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`, "Maybelline", "50"],
    [`${S3}/Lindsay+Gets+a+Glow-up+with+Verizon.mp4`, "Verizon", "42"],
    [`${S3}/Amazon+TV+Spot+Essentials+Waterproof+Mascara+-+iSpot.mp4`, "Amazon Essentials", "38"],
  ],
  volvo: [
    [`${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`, "Rocket + Redfin", "35"],
    [`${S3}/Nearly+Home%EF%BC%9A+The+One+with+the+Statement+Wall+-+Realtor.com.mp4`, "Realtor.com", "32"],
    [`${S3}/T-Mobile+Home+Internet+TV+Spot+Treadmill+30+per+Month+Featuring+Zach+Braff+Donald+Faison+-+iSpot.mp4`, "T-Mobile Home", "28"],
  ],
  jaguar: [
    [`${S3}/XFINITY+TV+Spot+Jurassic+Park+Ecosystem+Featuring+Jeff+Goldblum+Sam+Neill+Laura+Dern+-+iSpot.mp4`, "XFINITY", "40"],
    [`${S3}/Amazon+Alexa+Super+Bowl+2026+TV+Spot+Chris+Hemsworth+Thinks+Alexa+Is+Scary+Good+-+iSpot.mp4`, "Amazon Alexa", "35"],
    [`${S3}/Uber+Eats+TV+Spot+Passion+Fruit+Song+by+Aerosmith+-+iSpot.mp4`, "Uber Eats", "32"],
  ],
  cadillac: [
    [`${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`, "Nike", "48"],
    [`${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`, "Capital One", "42"],
    [`${S3}/Instacart+Super+Bowl+2026+TV+Spot+Bananas+Featuring+Benson+Boone+Ben+Stiller+-+iSpot.mp4`, "Instacart", "38"],
  ],
};

const FALLBACK_ADS: [string, string, string][] = [
  [`${S3}/Amazon+TV+Spot+Train+Robbery+-+iSpot.mp4`, "Amazon", "18"],
  [`${S3}/Progressive+TV+Spot+Sleepover+-+iSpot.mp4`, "Progressive", "15"],
  [`${S3}/Liberty+Mutual+TV+Spot+Truth+Tellers+Dating+App+-+iSpot.mp4`, "Liberty Mutual", "14"],
];

const DISPLAY_ADS = [
  { brand: "Kohl's",       tagline: "Home Refresh — Now On Sale",     cpm: 12, from: "#b91c1c", to: "#ea580c" },
  { brand: "Applebee's",   tagline: "Return of the Big Easy",         cpm: 8,  from: "#7f1d1d", to: "#b91c1c" },
  { brand: "Panera Bread", tagline: "Mix & Match — $4.99 Each",       cpm: 9,  from: "#15803d", to: "#0d9488" },
  { brand: "Olive Garden", tagline: "Embrace the Obsession",          cpm: 10, from: "#166534", to: "#15803d" },
  { brand: "Walmart",      tagline: "They Don't Know You Like We Do", cpm: 14, from: "#1d4ed8", to: "#3b82f6" },
  { brand: "Target",       tagline: "Last-Minute Deals — Shop Now",   cpm: 13, from: "#dc2626", to: "#db2777" },
  { brand: "GEICO",        tagline: "15 Minutes Could Save You 15%",  cpm: 18, from: "#16a34a", to: "#059669" },
  { brand: "Denny's",      tagline: "Slammin' Meal Deals",            cpm: 7,  from: "#ca8a04", to: "#ea580c" },
];

// Battery charges at this rate (% per second) in demo
const CHARGE_RATE = 0.18;

// ─── Component ────────────────────────────────────────────────────────────────

export default function KioskPage() {
  const [vehicle, setVehicle] = useState(VEHICLES[0]);
  const [stage, setStage] = useState<Stage>("start");
  const [adPhase, setAdPhase] = useState<AdPhase>("warmup");
  const [battery, setBattery] = useState(VEHICLES[0].start);
  const [elapsed, setElapsed] = useState(0); // seconds since charging started
  const [kwh, setKwh] = useState(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [hit1, setHit1] = useState(false);
  const [hit2, setHit2] = useState(false);
  const [completionStarted, setCompletionStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoAds = VIDEO_ADS[vehicle.make.toLowerCase()] ?? FALLBACK_ADS;
  const range = vehicle.target - vehicle.start;
  const trigger1 = vehicle.start + range * 0.35;
  const trigger2 = vehicle.start + range * 0.70;

  const cost = (kwh * vehicle.rate).toFixed(2);
  const remaining = Math.max(0, Math.ceil((vehicle.target - battery) / CHARGE_RATE / 60));
  const batteryColor = battery < 30 ? "bg-orange-400" : battery > 75 ? "bg-emerald-400" : "bg-teal-400";
  const batteryTextColor = battery < 30 ? "text-orange-400" : battery > 75 ? "text-emerald-400" : "text-teal-400";

  function resetAll(v = vehicle) {
    setVehicle(v);
    setStage("start");
    setAdPhase("warmup");
    setBattery(v.start);
    setElapsed(0);
    setKwh(0);
    setDisplayIdx(0);
    setHit1(false);
    setHit2(false);
    setCompletionStarted(false);
  }

  // Stage auto-advance
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (stage === "connect")    timers.push(setTimeout(() => setStage("auth"), 5000));
    if (stage === "auth")       timers.push(setTimeout(() => setStage("initiating"), 4000));
    if (stage === "initiating") timers.push(setTimeout(() => { setStage("charging"); setAdPhase("warmup"); }, 8000));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  // Charging battery tick
  useEffect(() => {
    if (stage !== "charging") return;
    timerRef.current = setInterval(() => {
      setElapsed(s => s + 1);
      setBattery(prev => {
        const next = parseFloat(Math.min(vehicle.target, prev + CHARGE_RATE).toFixed(2));
        if (next >= vehicle.target) {
          setStage("complete");
          setCompletionStarted(true);
        }
        return next;
      });
      setKwh(prev => prev + (CHARGE_RATE * 0.82 / 100));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, vehicle]);

  // Warmup → display after 20s
  useEffect(() => {
    if (stage !== "charging" || adPhase !== "warmup") return;
    const id = setTimeout(() => setAdPhase("display"), 20000);
    return () => clearTimeout(id);
  }, [stage, adPhase]);

  // Video triggers based on battery milestones
  useEffect(() => {
    if (stage !== "charging" || adPhase !== "display") return;
    if (!hit1 && battery >= trigger1) {
      setHit1(true);
      setAdPhase("video_1");
    } else if (hit1 && !hit2 && battery >= trigger2) {
      setHit2(true);
      setAdPhase("video_2");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battery, stage, adPhase]);

  // Display ad rotation every 12 seconds
  useEffect(() => {
    if (stage !== "charging" || adPhase !== "display") return;
    const id = setInterval(() => setDisplayIdx(i => (i + 1) % DISPLAY_ADS.length), 12000);
    return () => clearInterval(id);
  }, [stage, adPhase]);

  function onVideoEnded() {
    if (adPhase === "video_1" || adPhase === "video_2") setAdPhase("display");
  }

  const displayAd = DISPLAY_ADS[displayIdx];
  const currentVideoAd = adPhase === "video_1" ? videoAds[0] : videoAds[1];
  const completionVideoAd = videoAds[2];
  const isVideoPhase = adPhase === "video_1" || adPhase === "video_2";
  const sessionMin = Math.floor(elapsed / 60);

  const clock = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ─── START GATE ───────────────────────────────────────────────────────────
  if (stage === "start") {
    return (
      <div
        className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => setStage("connect")}
      >
        <img src="/videoev-icon.svg" alt="VideoEV" className="w-28 h-28 mb-6 drop-shadow-2xl" />
        <h1 className="text-4xl font-bold text-white mb-3">Video<span className="text-teal-400">EV</span></h1>
        <p className="text-slate-400 text-lg">Tap anywhere to start demo</p>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <select
            value={vehicle.make}
            onClick={e => e.stopPropagation()}
            onChange={e => {
              const v = VEHICLES.find(v => v.make === e.target.value) ?? VEHICLES[0];
              setVehicle(v);
              setBattery(v.start);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none"
          >
            {VEHICLES.map(v => <option key={v.make} value={v.make}>{v.label}</option>)}
          </select>
        </div>
      </div>
    );
  }

  // ─── CONNECT ──────────────────────────────────────────────────────────────
  if (stage === "connect") {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        {/* Full-screen video ad plays immediately on vehicle connect */}
        <div className="absolute inset-0">
          <VideoAd key={vehicle.make} src={videoAds[0][0]} loop />
        </div>
        <div className="absolute inset-0 bg-black/55" />
        {/* Stage overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center mb-8">
            <div className="w-36 h-36 rounded-full border border-teal-400/20 animate-ping absolute" />
            <div className="w-24 h-24 rounded-full border border-teal-400/50 animate-pulse absolute" />
            <img src="/videoev-icon.svg" alt="VideoEV" className="w-16 h-16 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicle Connected</h1>
          <p className="text-slate-300 text-lg mb-1">{vehicle.label}</p>
          <p className="text-slate-400 text-sm">Preparing payment authorization…</p>
        </div>
        <div className="absolute top-4 left-6 text-white/40 text-xs">Charger 03 · Station ID 110040-03</div>
        <div className="absolute top-4 right-6 text-white/40 text-xs">{clock}</div>
        <div className="absolute bottom-4 right-6 text-white/30 text-xs">1-833-632-2778 · VideoEV Network</div>
        {/* Ad label */}
        <div className="absolute bottom-4 left-6 bg-black/40 backdrop-blur rounded-full px-3 py-1 text-white/50 text-xs">
          {videoAds[0][1]} · ${videoAds[0][2]} CPM
        </div>
      </div>
    );
  }

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  if (stage === "auth") {
    return (
      <div className="h-screen w-screen relative overflow-hidden">
        {/* Video continues playing */}
        <div className="absolute inset-0">
          <VideoAd key={vehicle.make} src={videoAds[0][0]} loop />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        {/* Auth overlay card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="relative w-52 h-52 rounded-2xl flex flex-col items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(145deg, rgba(30,58,95,0.95), rgba(15,32,64,0.95))", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <svg viewBox="0 0 24 24" className="w-16 h-16 text-white mb-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-teal-400 font-bold text-xl tracking-widest">Authorized</span>
          </div>
        </div>
        <div className="absolute top-4 left-6 text-white/40 text-sm font-medium">Charger 03 · 1-833-632-2778</div>
        <div className="absolute top-4 right-6 text-white/40 text-sm">{clock}</div>
      </div>
    );
  }

  // ─── INITIATING ───────────────────────────────────────────────────────────
  if (stage === "initiating") {
    return (
      <div className="h-screen w-screen relative overflow-hidden">
        {/* Video continues playing */}
        <div className="absolute inset-0">
          <VideoAd key={vehicle.make} src={videoAds[0][0]} loop />
        </div>
        <div className="absolute inset-0 bg-black/60" />
        {/* Glowing horizontal lines */}
        <div className="absolute w-full pointer-events-none z-10" style={{ top: "49%", height: 3, background: "linear-gradient(90deg, transparent, #ff2d8a 25%, #ff80c0 50%, #ff2d8a 75%, transparent)", filter: "blur(1px)" }} />
        <div className="absolute w-full pointer-events-none z-10" style={{ top: "51%", height: 2, background: "linear-gradient(90deg, transparent 10%, #cc0066 35%, #ff1177 50%, #cc0066 65%, transparent 90%)", filter: "blur(3px)", opacity: 0.6 }} />
        {/* Spinner card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div
            className="w-52 h-52 rounded-2xl flex flex-col items-center justify-center shadow-2xl"
            style={{ background: "rgba(10, 20, 50, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(100,150,255,0.2)" }}
          >
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-white/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1s" }} />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/25 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
            </div>
            <span className="text-white text-base font-medium">Initiating charging</span>
          </div>
        </div>
        <div className="absolute top-4 left-6 text-white/30 text-xs z-30">Balanced Charger · 1-833-632-2778 · Charger ID110040-03</div>
        <div className="absolute top-4 right-6 text-white/30 text-xs z-30">{clock}</div>
      </div>
    );
  }

  // ─── COMPLETE ─────────────────────────────────────────────────────────────
  if (stage === "complete") {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Connected · Fairfield NB 2</span>
            <span>📞 1-888-557-7099</span>
          </div>
          <span className="text-sm text-slate-400">{clock}</span>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: summary */}
          <div className="flex flex-col items-center justify-center flex-1 px-12 bg-gradient-to-b from-blue-50 to-white">
            <div className="text-7xl mb-6">🚗⚡</div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Charging stopped</h1>
            <p className="text-slate-500 text-base mb-10 text-center">Please unplug the connector &amp; move your vehicle. Thank you.</p>
            <div className="flex gap-16 mb-10">
              <div>
                <p className="text-slate-400 text-sm mb-1">Charging Time</p>
                <p className="text-slate-800 text-4xl font-bold num">{sessionMin} min</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Energy Delivered</p>
                <p className="text-slate-800 text-4xl font-bold num">{kwh.toFixed(4)} kWh</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-0.5">Session Cost</p>
                <p className="text-slate-700 text-2xl font-bold num">${cost}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-0.5">Final Battery</p>
                <p className="text-emerald-600 text-2xl font-bold num">{Math.round(battery)}%</p>
              </div>
            </div>
            <button
              onClick={() => resetAll(vehicle)}
              className="mt-10 px-14 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-700 font-semibold text-lg hover:bg-slate-100 transition-colors"
            >
              New Session
            </button>
          </div>

          {/* Right: completion video ad */}
          <div className="w-[45%] shrink-0 bg-black flex flex-col">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between shrink-0">
              <span className="eyebrow text-slate-500">Sponsored · {completionVideoAd[1]}</span>
              <span className="text-slate-500 text-xs">${completionVideoAd[2]} CPM</span>
            </div>
            <div className="flex-1 min-h-0">
              {completionStarted && (
                <VideoAd key="complete" src={completionVideoAd[0]} />
              )}
            </div>
          </div>
        </div>

        <div className="h-9 bg-white border-t border-slate-200 flex items-center justify-end px-6 gap-4 text-xs text-slate-400 shrink-0">
          <span>Station ID 110040-03</span>
          <span>VideoEV Network</span>
        </div>
      </div>
    );
  }

  // ─── CHARGING ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900">
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left sidebar */}
        <aside className="w-72 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col p-5 overflow-hidden">
          <p className="eyebrow text-slate-500 mb-4">Charging Status</p>

          {/* Battery */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">🔋</span>
              <span className="eyebrow text-slate-400">Battery Level</span>
            </div>
            <div className={`text-3xl font-bold num ${batteryTextColor}`}>{Math.round(battery)}%</div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full transition-all duration-1000 ${batteryColor}`} style={{ width: `${battery}%` }} />
            </div>
            {/* Target indicator */}
            <div className="text-slate-600 text-xs mt-1">Target: {vehicle.target}%</div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">⚡</span>
              <span className="eyebrow text-slate-400">Power Delivered</span>
            </div>
            <div className="text-3xl font-bold num text-white">{kwh.toFixed(1)} kWh</div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">🕐</span>
              <span className="eyebrow text-slate-400">Time Remaining</span>
            </div>
            <div className="text-3xl font-bold num text-white">{remaining} min</div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">$</span>
              <span className="eyebrow text-slate-400">Session Cost</span>
            </div>
            <div className="text-3xl font-bold num text-white">${cost}</div>
            <div className="text-slate-600 text-xs mt-0.5">${vehicle.rate}/kWh</div>
          </div>

          <div className="flex-1 min-h-0" />

          {/* Ad info */}
          <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
            <p className="eyebrow text-slate-600 mb-1">Now Serving</p>
            {adPhase === "warmup" && (
              <>
                <p className="text-teal-400 font-semibold text-sm">{videoAds[0][1]}</p>
                <p className="text-slate-600 text-xs">Video · ${videoAds[0][2]} CPM</p>
              </>
            )}
            {adPhase === "display" && (
              <>
                <p className="text-yellow-400 font-semibold text-sm">{displayAd.brand}</p>
                <p className="text-slate-600 text-xs">Display · ${displayAd.cpm} CPM</p>
              </>
            )}
            {isVideoPhase && (
              <>
                <p className="text-teal-400 font-semibold text-sm">{currentVideoAd[1]}</p>
                <p className="text-slate-600 text-xs">Video · ${currentVideoAd[2]} CPM</p>
              </>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <span className="text-xl font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>
        </aside>

        {/* Right: ad zone */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 shrink-0">
            <span className="eyebrow text-slate-500">
              {vehicle.label} · {isVideoPhase ? `Video — ${currentVideoAd[1]}` : adPhase === "warmup" ? "Session Started" : `Display — ${displayAd.brand}`}
            </span>
            <span className="text-xl font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-black">
            {adPhase === "warmup" && (
              <VideoAd key={`warmup-${vehicle.make}`} src={videoAds[0][0]} loop />
            )}

            {adPhase === "display" && (
              <div
                key={displayIdx}
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${displayAd.from}, ${displayAd.to})` }}
              >
                <p className="text-white/50 eyebrow mb-4">Sponsored</p>
                <h2 className="text-7xl font-bold text-white mb-4 text-center px-8">{displayAd.brand}</h2>
                <p className="text-white/75 text-2xl text-center px-8">{displayAd.tagline}</p>
                <div className="absolute bottom-5 right-5 bg-black/25 backdrop-blur rounded-full px-3 py-1 text-white/50 text-xs">${displayAd.cpm} CPM</div>
                <div className="absolute top-5 right-5 text-white/30 text-xl font-bold">Video<span className="text-white/50">EV</span></div>
              </div>
            )}

            {isVideoPhase && (
              <VideoAd key={adPhase} src={currentVideoAd[0]} onEnded={onVideoEnded} />
            )}
          </div>
        </main>
      </div>

      {/* Bottom bar */}
      <footer className="h-11 shrink-0 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
          <span className="text-slate-300">Charging in progress · {vehicle.label}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400 num">
          <span>🔋 {Math.round(battery)}%</span>
          <span className="text-slate-700">·</span>
          <span>🕐 {remaining} min remaining</span>
        </div>
      </footer>
    </div>
  );
}
