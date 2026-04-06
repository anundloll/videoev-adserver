export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06090f] text-white antialiased flex flex-col">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="3.5" fill="#2dd4bf" />
            <circle cx="9" cy="9" r="7" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">VideoEV</span>
        </div>
        <a
          href="mailto:hello@videoev.com"
          className="text-xs font-medium text-white/40 hover:text-white transition-colors"
        >
          Contact
        </a>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">

        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-teal-400">
            Now in Beta
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
          The EV Charging{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
            Ad Network
          </span>
        </h1>

        <p className="mt-6 text-lg text-white/45 max-w-xl leading-relaxed">
          Premium video advertising delivered at the moment of charge. Reach high-income, eco-conscious drivers across the nation&rsquo;s fastest-growing EV network.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <a
            href="https://ads.videoev.com/plugin/demo"
            className="px-6 py-3 rounded-lg bg-teal-500 text-[#06090f] text-sm font-semibold hover:bg-teal-400 transition-colors"
          >
            Request Demo
          </a>
          <a
            href="https://ads.videoev.com/admin/campaigns"
            className="px-6 py-3 rounded-lg border border-white/[0.1] text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            Advertiser Login
          </a>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-8 py-5 border-t border-white/[0.05] flex items-center justify-between">
        <p className="text-xs text-white/20">© 2025 VideoEV. All rights reserved.</p>
        <p className="text-xs text-white/20">videoev.com</p>
      </footer>

    </div>
  );
}
