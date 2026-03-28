"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const VideoAd = dynamic(() => import("@/components/ImaPlayer"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = "start" | "connect" | "auth" | "initiating" | "starting" | "charging" | "complete";
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
  const [carMake, setCarMake] = useState("porsche");
  const [locationCtx, setLocationCtx] = useState<"highway" | "school">("highway");
  const [batteryCtx, setBatteryCtx] = useState<"80" | "15">("80");
  const [venueCtx, setVenueCtx] = useState<"luxury_retail" | "grocery" | "highway_rest">("luxury_retail");
  const [msrpCtx, setMsrpCtx] = useState<"120k+" | "80k-120k">("120k+");
  const [dwellCtx, setDwellCtx] = useState<"45" | "15">("45");
  const [weatherCtx, setWeatherCtx] = useState<"sunny" | "rainy" | "cloudy">("sunny");
  const [timeCtx, setTimeCtx] = useState<"morning" | "afternoon" | "evening">("morning");
  const [trafficCtx, setTrafficCtx] = useState<"low" | "medium" | "high">("low");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const terminalTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const terminalBoxRef = useRef<HTMLDivElement>(null);

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

  // AdCP terminal animation
  useEffect(() => {
    terminalTimers.current.forEach(clearTimeout);
    setTerminalLines([]);
    const venueLabel = venueCtx === "luxury_retail" ? "Luxury Retail" : venueCtx === "grocery" ? "Grocery" : "Highway Rest Stop";
    const weatherLabel = weatherCtx === "sunny" ? "Sunny" : weatherCtx === "rainy" ? "Rainy" : "Cloudy";
    const timeLabel = timeCtx === "morning" ? "Morning" : timeCtx === "afternoon" ? "Afternoon" : "Evening";
    const trafficLabel = trafficCtx === "low" ? "Low" : trafficCtx === "medium" ? "Medium" : "High";
    const lines: string[] = [
      `[VideoEV] Handshake complete · Charger 03`,
      `[VideoEV] Vehicle fingerprint acquired: ${carMake}`,
      `[OCPP] MSRP Proxy: $${msrpCtx} | Dwell: ${dwellCtx} mins | Venue: ${venueLabel}`,
      `[ENV] Weather: ${weatherLabel} | Time: ${timeLabel} | Traffic: ${trafficLabel}`,
    ];
    if (weatherCtx === "rainy") {
      lines.push(`[WEATHER] Rainy conditions. Serving comfort/warmth creative.`);
    }
    if (locationCtx === "school") {
      lines.push(`[BRAND SAFETY] School zone detected. Restricting mature categories.`);
    }
    if (batteryCtx === "15") {
      lines.push(`[CONTEXT] Low battery detected. Prioritizing QSR/Food ads.`);
    }
    lines.push(`[AdCP] Resolving audience profile...`);
    lines.push(`[AdCP] Bid won · Serving targeted creative.`);
    terminalTimers.current = lines.map((line, i) =>
      setTimeout(() => setTerminalLines(prev => [...prev, line]), (i + 1) * 500)
    );
    return () => terminalTimers.current.forEach(clearTimeout);
  }, [carMake, locationCtx, batteryCtx, venueCtx, msrpCtx, dwellCtx, weatherCtx, timeCtx, trafficCtx]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Stage auto-advance
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (stage === "connect")    timers.push(setTimeout(() => setStage("auth"),       20000));
    if (stage === "auth")       timers.push(setTimeout(() => setStage("initiating"), 15000));
    if (stage === "initiating") timers.push(setTimeout(() => setStage("starting"),   22000));
    if (stage === "starting")   timers.push(setTimeout(() => { setStage("charging"); setAdPhase("warmup"); }, 3000));
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
  const adTagPath = `/api/decision?car_make=${carMake}&location=${locationCtx}&battery=${batteryCtx}&venue=${venueCtx}&msrp=${msrpCtx}&dwell=${dwellCtx}&weather=${weatherCtx}&time=${timeCtx}&traffic=${trafficCtx}`;

  // ─── START GATE ───────────────────────────────────────────────────────────
  if (stage === "start") {
    return (
      <div
        className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => setStage("connect")}
      >
        <img src="/videoev-icon-clear.svg" alt="VideoEV" className="w-28 h-28 mb-6 drop-shadow-2xl" />
        <h1 className="text-4xl font-bold text-white mb-3">Video<span className="text-teal-400">EV</span></h1>
        <p className="text-slate-400 text-lg">Tap anywhere to start demo</p>
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2">
          <p className="text-slate-600 text-xs tracking-widest uppercase">Select vehicle</p>
          <select
            value={vehicle.make}
            onClick={e => e.stopPropagation()}
            onChange={e => {
              const v = VEHICLES.find(v => v.make === e.target.value) ?? VEHICLES[0];
              setVehicle(v);
              setBattery(v.start);
            }}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
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
          <VideoAd key="pre-1" src={FALLBACK_ADS[0][0]} loop />
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
          <VideoAd key="pre-2" src={FALLBACK_ADS[1][0]} loop />
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
          <VideoAd key="pre-3" src={FALLBACK_ADS[1][0]} loop />
        </div>
        <PreChargeBar
          stepIndex={2}
          statusLine="Initiating charge — this will take just a moment…"
        />
      </div>
    );
  }

  // ─── STARTING (transition) ────────────────────────────────────────────────
  if (stage === "starting") {
    return (
      <div
        className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950"
        style={{ animation: "fadeIn 0.3s ease-out" }}
      >
        <style>{`@keyframes fadeIn { from { opacity: 0.2; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
        <div className="w-20 h-20 rounded-full bg-teal-400/15 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">Charging Started</h2>
        <p className="text-slate-400 text-lg mb-8">{vehicle.label} · Starting at {vehicle.start}%</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-teal-400 text-sm font-medium">Power flowing — ${vehicle.rate}/kWh</span>
        </div>
        <div className="absolute bottom-6 flex items-center gap-2 text-slate-700 text-xs">
          <img src="/videoev-icon.svg" alt="VideoEV" className="w-5 h-5 opacity-40" />
          <span>VideoEV · Charger 03</span>
        </div>
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

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left: summary */}
          <div className="flex flex-col items-center justify-center w-full lg:w-1/3 shrink-0 px-6 py-5 lg:py-0 max-h-[45vh] lg:max-h-none bg-gradient-to-b from-blue-50 to-white overflow-auto" style={{ scrollbarWidth: "none" } as any}>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1 text-center">Charging complete</h1>
            <p className="text-slate-500 text-sm mb-7 text-center">Please unplug the connector &amp; move your vehicle.</p>
            <div className="flex gap-8 mb-7">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Charging Time</p>
                <p className="text-slate-800 text-2xl lg:text-3xl font-bold num">{sessionMin} min</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-0.5">Energy Delivered</p>
                <p className="text-slate-800 text-2xl lg:text-3xl font-bold num">{kwh.toFixed(4)} kWh</p>
              </div>
            </div>
            <div className="flex gap-6 mb-7">
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-0.5">Session Cost</p>
                <p className="text-slate-700 text-xl font-bold num">${cost}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-0.5">Final Battery</p>
                <p className="text-emerald-600 text-xl font-bold num">{Math.round(battery)}%</p>
              </div>
            </div>
            <button
              onClick={() => resetAll(vehicle)}
              className="px-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-700 font-semibold text-base hover:bg-slate-100 transition-colors"
            >
              New Session
            </button>
          </div>

          {/* Right: completion video ad */}
          <div className="flex-1 min-h-0 bg-black flex flex-col">
            <div className="px-4 py-2 bg-slate-900 flex items-center justify-between shrink-0">
              <span className="eyebrow text-slate-500">Sponsored · {completionVideoAd[1]}</span>
              <span className="text-slate-500 text-xs">${completionVideoAd[2]} CPM</span>
            </div>
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {completionStarted && (
                <div className="absolute inset-0">
                  <VideoAd key="complete" src={completionVideoAd[0]} />
                </div>
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
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

        {/* Left sidebar */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <aside className="w-full lg:w-72 shrink-0 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col p-4 lg:p-5 overflow-y-auto order-2 lg:order-1 max-h-[40vh] lg:max-h-none" style={{ scrollbarWidth: "none" } as any}>
          <p className="eyebrow text-slate-500 mb-2">Charging Status</p>

          {/* Car selector */}
          <div className="flex gap-1 mb-3">
            {["porsche", "ford", "tesla"].map(make => (
              <button
                key={make}
                onClick={() => setCarMake(make)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded capitalize transition-colors ${
                  carMake === make
                    ? "bg-teal-400 text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {make}
              </button>
            ))}
          </div>

          {/* Context controls */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Location</span>
              <select
                value={locationCtx}
                onChange={e => setLocationCtx(e.target.value as "highway" | "school")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="highway">Highway</option>
                <option value="school">School Zone</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Battery</span>
              <select
                value={batteryCtx}
                onChange={e => setBatteryCtx(e.target.value as "80" | "15")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="80">80%</option>
                <option value="15">15%</option>
              </select>
            </div>
          </div>
          <div className="mb-2">
            <span className="eyebrow text-slate-500 block mb-1">Venue Type</span>
            <select
              value={venueCtx}
              onChange={e => setVenueCtx(e.target.value as "luxury_retail" | "grocery" | "highway_rest")}
              className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
            >
              <option value="luxury_retail">Luxury Retail</option>
              <option value="grocery">Grocery</option>
              <option value="highway_rest">Highway</option>
            </select>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">MSRP Proxy</span>
              <select
                value={msrpCtx}
                onChange={e => setMsrpCtx(e.target.value as "120k+" | "80k-120k")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="120k+">$120k+</option>
                <option value="80k-120k">$80k–$120k</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Est. Dwell</span>
              <select
                value={dwellCtx}
                onChange={e => setDwellCtx(e.target.value as "45" | "15")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="45">45 mins</option>
                <option value="15">15 mins</option>
              </select>
            </div>
          </div>

          {/* Weather / Time / Traffic */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Weather</span>
              <select
                value={weatherCtx}
                onChange={e => setWeatherCtx(e.target.value as "sunny" | "rainy" | "cloudy")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="sunny">Sunny</option>
                <option value="rainy">Rainy</option>
                <option value="cloudy">Cloudy</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Time</span>
              <select
                value={timeCtx}
                onChange={e => setTimeCtx(e.target.value as "morning" | "afternoon" | "evening")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Traffic</span>
              <select
                value={trafficCtx}
                onChange={e => setTrafficCtx(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Battery */}
          <div className="mb-3">
            <span className="eyebrow text-slate-400">Battery Level</span>
            <div className={`text-2xl font-bold num mt-0.5 ${batteryTextColor}`}>{Math.round(battery)}%</div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1.5">
              <div className={`h-full rounded-full transition-all duration-1000 ${batteryColor}`} style={{ width: `${battery}%` }} />
            </div>
            <div className="text-slate-600 text-xs mt-0.5">Target {vehicle.target}%</div>
          </div>

          {/* Power + Time in a row */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <span className="eyebrow text-slate-400">Power</span>
              <div className="text-2xl font-bold num text-white mt-0.5">{kwh.toFixed(1)} kWh</div>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-400">Time Left</span>
              <div className="text-2xl font-bold num text-white mt-0.5">{remaining} min</div>
            </div>
          </div>

          <div className="mb-4">
            <span className="eyebrow text-slate-400">Session Cost</span>
            <div className="text-2xl font-bold num text-white mt-0.5">${cost}</div>
            <div className="text-slate-600 text-xs">${vehicle.rate}/kWh</div>
          </div>

          {/* AdCP terminal */}
          <div className="mt-3 shrink-0 bg-black rounded-lg border border-slate-800 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="eyebrow text-slate-500">AdCP Terminal</span>
            </div>
            <div
              ref={terminalBoxRef}
              className="px-3 py-2 font-mono text-xs space-y-0.5 min-h-[65px] max-h-[90px] overflow-y-auto"
            >
              {terminalLines.length === 0 && (
                <p className="text-slate-700">Waiting for connection...</p>
              )}
              {terminalLines.map((line, i) => (
                <p key={i} className={
                  line.startsWith("[BRAND SAFETY]") ? "text-orange-400" :
                  line.startsWith("[CONTEXT]") ? "text-yellow-400" :
                  line.startsWith("[OCPP]") ? "text-sky-400" :
                  line.startsWith("[ENV]") ? "text-violet-400" :
                  line.startsWith("[WEATHER]") ? "text-blue-400" :
                  line.includes("Bid won") ? "text-teal-400" :
                  "text-slate-500"
                }>{line}</p>
              ))}
            </div>
          </div>

          {/* Developer Tools */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 mb-2">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="eyebrow text-slate-500">Developer Tools</span>
            </div>

            <span className="eyebrow text-slate-600 block mb-1">Live VAST Tag</span>
            <div className="relative bg-slate-950 border border-slate-800 rounded-md overflow-hidden mb-2">
              <textarea
                readOnly
                value={adTagPath}
                rows={3}
                className="w-full bg-transparent font-mono text-[10px] text-teal-300/70 px-2.5 py-2 resize-none focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  const full = window.location.origin + adTagPath;
                  navigator.clipboard.writeText(full).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  copied
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300"
                }`}
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy URL
                  </>
                )}
              </button>
              <button
                onClick={() => window.open(window.location.origin + adTagPath, "_blank")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-300 rounded text-xs font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View Raw XML
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-base font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>
        </aside>

        {/* Right: ad zone */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 order-1 lg:order-2">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 shrink-0">
            <span className="eyebrow text-slate-500">
              {vehicle.label} · {isVideoPhase ? `Video — ${currentVideoAd[1]}` : adPhase === "warmup" ? "Session Started" : `Display — ${displayAd.brand}`}
            </span>
            <span className="text-xl font-bold">Video<span className="text-teal-400">EV</span></span>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 bg-black">
            {adPhase === "warmup" && (
              <VideoAd key={`${carMake}-${locationCtx}-${batteryCtx}-${venueCtx}-${msrpCtx}-${dwellCtx}-${weatherCtx}-${timeCtx}-${trafficCtx}`} src={adTagPath} loop />
            )}

            {adPhase === "display" && (
              <div
                key={displayIdx}
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${displayAd.from}, ${displayAd.to})` }}
              >
                <p className="text-white/50 eyebrow mb-4">Sponsored</p>
                <h2 className="text-4xl lg:text-7xl font-bold text-white mb-4 text-center px-8">{displayAd.brand}</h2>
                <p className="text-white/75 text-lg lg:text-2xl text-center px-8">{displayAd.tagline}</p>
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
      <footer className="h-11 shrink-0 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 lg:px-5">
        <div className="flex items-center gap-2 text-xs lg:text-sm min-w-0">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
          <span className="text-slate-300 truncate">Charging · {vehicle.label}</span>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm text-slate-400 num shrink-0">
          <span>{Math.round(battery)}%</span>
          <span className="text-slate-700">·</span>
          <span>{remaining} min</span>
        </div>
      </footer>
    </div>
  );
}
