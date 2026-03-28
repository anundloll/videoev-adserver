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

  // Shared bottom bar for pre-charge stages
  const STEPS = ["Connected", "Authorized", "Starting"];
  const PreChargeBar = ({ stepIndex, statusLine }: { stepIndex: number; statusLine: string }) => (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 px-8 pt-10 pb-5"
      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)" }}
    >
      {/* Step progress */}
      <div className="flex items-center justify-center mb-3">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIndex  ? "bg-teal-400 text-black" :
                i === stepIndex ? "bg-white text-slate-900" :
                "bg-white/15 text-white/30"
              }`}>
                {i < stepIndex
                  ? <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : i + 1}
              </div>
              <span className={`text-xs font-medium tracking-wide ${
                i === stepIndex ? "text-white" :
                i < stepIndex  ? "text-teal-400" :
                "text-white/25"
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-20 h-px mx-2 mb-4 ${i < stepIndex ? "bg-teal-400" : "bg-white/15"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Status message */}
      <p className="text-center text-white/65 text-sm mb-3">{statusLine}</p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/videoev-icon.svg" alt="VideoEV" className="w-6 h-6" />
          <span className="text-white/40 text-xs font-semibold tracking-wide">VideoEV</span>
        </div>
        <div className="text-white/25 text-xs">{clock} · Charger 03</div>
      </div>
    </div>
  );

  // ─── CONNECT ──────────────────────────────────────────────────────────────
  if (stage === "connect") {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <VideoAd key={`connect-${vehicle.make}`} src={videoAds[0][0]} loop />
        </div>
        <PreChargeBar
          stepIndex={0}
          statusLine={`${vehicle.label} detected — establishing connection`}
        />
      </div>
    );
  }

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  if (stage === "auth") {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <VideoAd key={`auth-${vehicle.make}`} src={videoAds[1][0]} loop />
        </div>
        <PreChargeBar
          stepIndex={1}
          statusLine="Payment authorized — preparing your charge session"
        />
      </div>
    );
  }

  // ─── INITIATING ───────────────────────────────────────────────────────────
  if (stage === "initiating") {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <VideoAd key={`auth-${vehicle.make}`} src={videoAds[1][0]} loop />
        </div>
        <PreChargeBar
          stepIndex={2}
          statusLine="Initiating charge — this will take just a moment…"
        />
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
