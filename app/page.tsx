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

// Venue-contextual display ads (Slot 2 of the Session Playlist)
const VENUE_CTX_ADS: Record<string, { brand: string; tagline: string; cpm: number; from: string; to: string }> = {
  luxury_retail: { brand: "Tiffany & Co.",  tagline: "Some Style Is Timeless",    cpm: 52, from: "#1c1917", to: "#44403c" },
  shopping_mall: { brand: "Apple",           tagline: "Think Different",           cpm: 42, from: "#1e3a5f", to: "#1d4ed8" },
  grocery:       { brand: "Instacart",       tagline: "Groceries, Delivered",      cpm: 20, from: "#14532d", to: "#15803d" },
  downtown:      { brand: "Uber Eats",       tagline: "Tonight, I'll Have...",     cpm: 28, from: "#1c1917", to: "#78350f" },
  airport:       { brand: "T-Mobile",        tagline: "Stay Connected Anywhere",   cpm: 30, from: "#4a044e", to: "#7e22ce" },
  hotel:         { brand: "Marriott",        tagline: "Travel Brilliantly",        cpm: 38, from: "#0c2340", to: "#0369a1" },
  office:        { brand: "LinkedIn",        tagline: "It's Not Who You Know",     cpm: 35, from: "#0a3561", to: "#0077b5" },
  university:    { brand: "Spotify",         tagline: "Listen Without Limits",     cpm: 25, from: "#064e3b", to: "#15803d" },
  stadium:       { brand: "Nike",            tagline: "Just Do It",               cpm: 34, from: "#111827", to: "#374151" },
  hospital:      { brand: "CVS Health",      tagline: "Health Is Everything",      cpm: 18, from: "#7f1d1d", to: "#b91c1c" },
  highway_rest:  { brand: "McDonald's",      tagline: "I'm Lovin' It",             cpm: 22, from: "#92400e", to: "#b45309" },
};

const DISPLAY_ADS = [
  // ── Financial Services ──────────────────────────────────────────────────────
  { brand: "Chase",             tagline: "Make More of What's Yours",            cpm: 32, from: "#0c2340", to: "#1d4ed8", qr: true },
  { brand: "American Express",  tagline: "Don't Live Life Without It",           cpm: 48, from: "#1c1917", to: "#3b4252" },
  { brand: "Citi",              tagline: "Progress Is Made By Doing",            cpm: 28, from: "#003b6f", to: "#0369a1" },
  { brand: "Wells Fargo",       tagline: "Built for You",                        cpm: 25, from: "#7c2d12", to: "#c2410c" },
  { brand: "Goldman Sachs",     tagline: "Progress Engineered",                  cpm: 55, from: "#0f172a", to: "#1e293b" },
  { brand: "Morgan Stanley",    tagline: "Advantage. Always.",                   cpm: 52, from: "#0a1628", to: "#1e3a5f" },
  { brand: "Fidelity",          tagline: "Your Path to Financial Freedom",       cpm: 35, from: "#164e63", to: "#0e7490" },
  { brand: "Charles Schwab",    tagline: "Own Your Tomorrow",                    cpm: 33, from: "#003087", to: "#1d4ed8" },
  { brand: "Vanguard",          tagline: "Stay the Course",                      cpm: 30, from: "#0f4c35", to: "#15803d" },
  { brand: "Robinhood",         tagline: "Investing for Everyone",               cpm: 22, from: "#00c805", to: "#15803d" },
  { brand: "SoFi",              tagline: "Get Your Money Right",                 cpm: 26, from: "#0d3d5e", to: "#0369a1", qr: true },
  { brand: "Ally Bank",         tagline: "We're on Your Side",                   cpm: 24, from: "#7a3200", to: "#c2410c" },
  { brand: "Marcus by Goldman", tagline: "Banking Built Around You",             cpm: 28, from: "#0f172a", to: "#334155" },
  { brand: "Betterment",        tagline: "Invest in You",                        cpm: 27, from: "#00416b", to: "#0369a1" },
  { brand: "PayPal",            tagline: "Send. Shop. Get Paid.",                cpm: 20, from: "#003087", to: "#0ea5e9" },
  { brand: "Venmo",             tagline: "Pay Friends in a Tap",                 cpm: 16, from: "#3d5a80", to: "#0369a1" },
  { brand: "Cash App",          tagline: "Get Paid Instantly",                   cpm: 18, from: "#00d632", to: "#059669" },
  { brand: "Coinbase",          tagline: "Update Your Financial Profile",        cpm: 32, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Mastercard",        tagline: "Priceless Experiences Await",          cpm: 42, from: "#7c2d12", to: "#ea580c" },
  { brand: "Discover",          tagline: "We Treat You Like You'd Treat You",    cpm: 24, from: "#c2410c", to: "#f59e0b" },
  { brand: "E*TRADE",           tagline: "It's Time to Invest in You",           cpm: 29, from: "#164e63", to: "#0e7490" },
  { brand: "Wealthfront",       tagline: "Hands-Off Investing",                  cpm: 26, from: "#0d3d5e", to: "#0284c7" },
  { brand: "Stripe",            tagline: "Payments Infrastructure for the Web",  cpm: 38, from: "#635bff", to: "#4f46e5" },
  { brand: "Bank of America",   tagline: "What Would You Like the Power to Do?", cpm: 27, from: "#c00", to: "#e11d48" },
  { brand: "USAA",              tagline: "Serving Those Who Served",             cpm: 30, from: "#00205b", to: "#1d4ed8" },

  // ── Luxury Goods ────────────────────────────────────────────────────────────
  { brand: "Tiffany & Co.",     tagline: "Some Style Is Timeless",               cpm: 62, from: "#0d9488", to: "#0f766e" },
  { brand: "Cartier",           tagline: "Dare to Be",                           cpm: 70, from: "#7f1d1d", to: "#991b1b" },
  { brand: "Rolex",             tagline: "A Crown for Every Achievement",        cpm: 75, from: "#14532d", to: "#166534" },
  { brand: "Louis Vuitton",     tagline: "A Journey Is Its Own Reward",          cpm: 80, from: "#3b1800", to: "#78350f" },
  { brand: "Gucci",             tagline: "The Ritual of Beauty",                 cpm: 72, from: "#14532d", to: "#1a2e05" },
  { brand: "Prada",             tagline: "An Idea. An Object. A World.",         cpm: 68, from: "#1c1917", to: "#292524" },
  { brand: "Hermès",            tagline: "Craftmanship That Endures",            cpm: 85, from: "#7c2d12", to: "#9a3412" },
  { brand: "Chanel",            tagline: "Elegance Is Refusal",                  cpm: 78, from: "#1c1917", to: "#0f172a" },
  { brand: "Dior",              tagline: "The Art of Being",                     cpm: 72, from: "#1e3a5f", to: "#312e81" },
  { brand: "Bulgari",           tagline: "Unexpected Wonder",                    cpm: 66, from: "#14532d", to: "#0d9488" },
  { brand: "Patek Philippe",    tagline: "You Never Actually Own a Patek",       cpm: 90, from: "#0f172a", to: "#1e293b", qr: true },
  { brand: "Breitling",         tagline: "Instruments for Professionals",        cpm: 65, from: "#0c1a2e", to: "#1e3a5f" },
  { brand: "TAG Heuer",         tagline: "Don't Crack Under Pressure",           cpm: 58, from: "#0f172a", to: "#1e293b" },
  { brand: "Chopard",           tagline: "Happy Diamonds",                       cpm: 72, from: "#1c1917", to: "#292524" },
  { brand: "Versace",           tagline: "Born In Rome",                         cpm: 64, from: "#78350f", to: "#92400e" },
  { brand: "Bottega Veneta",    tagline: "When Your Own Initials Are Enough",    cpm: 70, from: "#1c1917", to: "#3b2314" },
  { brand: "Balenciaga",        tagline: "Building a Legacy",                    cpm: 66, from: "#0f172a", to: "#1e293b" },
  { brand: "Saint Laurent",     tagline: "Forever Young",                        cpm: 68, from: "#1c1917", to: "#292524" },
  { brand: "Burberry",          tagline: "See Beyond",                           cpm: 60, from: "#3b1800", to: "#7c2d12" },
  { brand: "Audemars Piguet",   tagline: "To Break the Rules You Must Master Them", cpm: 88, from: "#0a1628", to: "#1e3a5f", qr: true },

  // ── Pharmaceutical / Health ──────────────────────────────────────────────────
  { brand: "CVS Health",        tagline: "Health Is Everything",                 cpm: 20, from: "#7f1d1d", to: "#b91c1c" },
  { brand: "Walgreens",         tagline: "Trusted Since 1901",                   cpm: 18, from: "#cc0000", to: "#dc2626" },
  { brand: "GoodRx",            tagline: "Compare Prescription Prices",          cpm: 22, from: "#0f766e", to: "#0d9488", qr: true },
  { brand: "Hims & Hers",       tagline: "Personalized Health Starts Here",      cpm: 28, from: "#3d5a80", to: "#0369a1" },
  { brand: "Ro (Roman)",        tagline: "Healthcare That Comes to You",         cpm: 25, from: "#0c2340", to: "#1d4ed8" },
  { brand: "Noom",              tagline: "Stop Dieting. Start Living.",          cpm: 20, from: "#14532d", to: "#15803d" },
  { brand: "Novo Nordisk",      tagline: "Changing Lives with Science",          cpm: 38, from: "#003087", to: "#1d4ed8" },
  { brand: "Abbott",            tagline: "Life. To the Fullest.",                cpm: 30, from: "#003087", to: "#0369a1" },
  { brand: "Pfizer",            tagline: "Science Will Win",                     cpm: 35, from: "#00205b", to: "#003087" },
  { brand: "Advil",             tagline: "Tough Medicine for Tough Pain",        cpm: 16, from: "#003087", to: "#1d4ed8" },
  { brand: "Tylenol",           tagline: "Feel Better. Be Better.",              cpm: 14, from: "#dc2626", to: "#b91c1c" },
  { brand: "Claritin",          tagline: "Live Claritin Clear",                  cpm: 15, from: "#0284c7", to: "#0ea5e9" },
  { brand: "Zyrtec",            tagline: "Muddle Through No More",               cpm: 16, from: "#7c3aed", to: "#8b5cf6" },
  { brand: "Allegra",           tagline: "Live Allergic Rhinitis Free",          cpm: 14, from: "#15803d", to: "#16a34a" },
  { brand: "MedExpress",        tagline: "Quality Urgent Care, Near You",        cpm: 18, from: "#0c2340", to: "#1d4ed8" },
  { brand: "Teladoc",           tagline: "Get Better, Faster",                   cpm: 22, from: "#7f1d1d", to: "#dc2626", qr: true },
  { brand: "MDLive",            tagline: "Online Doctors, When You Need Them",   cpm: 20, from: "#0f766e", to: "#0d9488" },
  { brand: "One Medical",       tagline: "A Different Kind of Doctor's Office",  cpm: 30, from: "#164e63", to: "#0e7490" },
  { brand: "Optum",             tagline: "Health and Well-Being in Harmony",     cpm: 32, from: "#f97316", to: "#ea580c" },
  { brand: "HealthMarkets",     tagline: "Find the Right Health Plan for You",   cpm: 20, from: "#1d4ed8", to: "#2563eb" },

  // ── Legal Services ──────────────────────────────────────────────────────────
  { brand: "LegalZoom",         tagline: "Legal Made Easy",                      cpm: 22, from: "#1d4ed8", to: "#2563eb", qr: true },
  { brand: "Rocket Lawyer",     tagline: "Legal Documents in Minutes",           cpm: 20, from: "#dc2626", to: "#ef4444" },
  { brand: "JustAnswer",        tagline: "Ask a Lawyer Now",                     cpm: 18, from: "#0f766e", to: "#0d9488" },
  { brand: "Morgan & Morgan",   tagline: "For the People",                       cpm: 28, from: "#7c2d12", to: "#c2410c" },
  { brand: "US Legal Services", tagline: "Legal Help for Everyone",              cpm: 16, from: "#003087", to: "#1d4ed8" },
  { brand: "FindLaw",           tagline: "Find Lawyers. Find Answers.",          cpm: 15, from: "#0c2340", to: "#1e3a5f" },
  { brand: "Avvo",              tagline: "Connecting People with Lawyers",       cpm: 14, from: "#0369a1", to: "#0284c7" },
  { brand: "LawDepot",          tagline: "Create Legal Documents in Minutes",    cpm: 16, from: "#4f46e5", to: "#6366f1" },
  { brand: "Martindale",        tagline: "Connecting Clients & Attorneys",       cpm: 18, from: "#1e3a5f", to: "#1d4ed8" },
  { brand: "Jacoby & Meyers",   tagline: "Making Law Work for Everyone",         cpm: 20, from: "#7c2d12", to: "#991b1b" },
  { brand: "LegalShield",       tagline: "Legal Protection for Everyone",        cpm: 18, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Nolo",              tagline: "Law for All",                          cpm: 14, from: "#164e63", to: "#0e7490" },
  { brand: "Injury Help Hotline", tagline: "You Deserve Compensation",           cpm: 22, from: "#7f1d1d", to: "#b91c1c" },
  { brand: "Class Action Connect", tagline: "You May Be Owed Money",             cpm: 20, from: "#92400e", to: "#b45309" },
  { brand: "Rocket Legal+",     tagline: "More Than a Document — It's a Shield", cpm: 22, from: "#dc2626", to: "#c2410c" },

  // ── Home Furniture ───────────────────────────────────────────────────────────
  { brand: "IKEA",              tagline: "The Wonderful Everyday",               cpm: 16, from: "#003087", to: "#f59e0b" },
  { brand: "Pottery Barn",      tagline: "Inspire Your Home",                    cpm: 28, from: "#78350f", to: "#92400e" },
  { brand: "West Elm",          tagline: "Modern Furniture. Real Life.",         cpm: 26, from: "#3b2314", to: "#78350f" },
  { brand: "RH",                tagline: "The Gallery at Your Home",             cpm: 55, from: "#1c1917", to: "#292524", qr: true },
  { brand: "Crate & Barrel",    tagline: "Well Crafted, Well Lived",             cpm: 30, from: "#3b1800", to: "#78350f" },
  { brand: "Williams-Sonoma",   tagline: "Furnish Your Whole Life",              cpm: 32, from: "#7c2d12", to: "#9a3412" },
  { brand: "Wayfair",           tagline: "A Zillion Things Home",                cpm: 22, from: "#7c3aed", to: "#8b5cf6" },
  { brand: "Ashley Furniture",  tagline: "Life Is Better at Home",               cpm: 18, from: "#1c4b2e", to: "#14532d" },
  { brand: "La-Z-Boy",          tagline: "Live Life Comfortably",                cpm: 16, from: "#92400e", to: "#b45309" },
  { brand: "Ethan Allen",       tagline: "Crafted to Be Lived In",               cpm: 28, from: "#3b2314", to: "#78350f" },
  { brand: "Arhaus",            tagline: "Handcrafted. Custom Made.",            cpm: 32, from: "#1c1917", to: "#3b2314" },
  { brand: "CB2",               tagline: "Modern. Eclectic. Affordable.",        cpm: 24, from: "#1c1917", to: "#292524" },
  { brand: "Article",           tagline: "Modern Furniture, Fair Price",         cpm: 20, from: "#0f766e", to: "#0d9488" },
  { brand: "Joybird",           tagline: "Furniture That Fits Your Vibe",        cpm: 18, from: "#7c2d12", to: "#b91c1c" },
  { brand: "Design Within Reach", tagline: "Modern Furniture, Within Reach",     cpm: 38, from: "#0f172a", to: "#1e293b", qr: true },
  { brand: "Serena & Lily",     tagline: "Relaxed California Style",             cpm: 34, from: "#0c4a6e", to: "#0369a1" },
  { brand: "Restoration Hardware", tagline: "The Art of the Home",              cpm: 50, from: "#292524", to: "#44403c" },
  { brand: "Anthropologie Home", tagline: "Curated for the Curious",             cpm: 30, from: "#4c1d95", to: "#7c3aed" },
  { brand: "Z Gallerie",        tagline: "Make a Statement",                     cpm: 22, from: "#111827", to: "#374151" },
  { brand: "Benchmade Modern",  tagline: "Built for How You Live",               cpm: 26, from: "#3b2314", to: "#78350f" },

  // ── Home Services ────────────────────────────────────────────────────────────
  { brand: "Angi",              tagline: "Connecting Pros with Projects",        cpm: 18, from: "#dc2626", to: "#ef4444" },
  { brand: "TaskRabbit",        tagline: "Hire Skilled Taskers",                 cpm: 16, from: "#7c2d12", to: "#c2410c" },
  { brand: "Handy",             tagline: "Home Services at Your Fingertips",     cpm: 15, from: "#0369a1", to: "#0284c7" },
  { brand: "Thumbtack",         tagline: "Find Local Pros",                      cpm: 16, from: "#0f766e", to: "#0d9488" },
  { brand: "ADT",               tagline: "Always There",                         cpm: 22, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Vivint",            tagline: "Smarter Home, Safer Home",             cpm: 26, from: "#0c2340", to: "#1e3a5f" },
  { brand: "Sunrun",            tagline: "Go Solar, Stay in Charge",             cpm: 28, from: "#f59e0b", to: "#d97706" },
  { brand: "Terminix",          tagline: "Protect Your Home",                    cpm: 18, from: "#003087", to: "#1d4ed8" },
  { brand: "Orkin",             tagline: "Pests Have Met Their Match",           cpm: 16, from: "#16a34a", to: "#15803d" },
  { brand: "Stanley Steemer",   tagline: "Cleaner Carpets Today",               cpm: 14, from: "#f97316", to: "#ea580c" },
  { brand: "Molly Maid",        tagline: "Professional Clean. Real Life Easy.",  cpm: 15, from: "#0369a1", to: "#0284c7" },
  { brand: "Roto-Rooter",       tagline: "Plumbing & Drain. 24/7.",             cpm: 16, from: "#dc2626", to: "#b91c1c" },
  { brand: "Mr. Appliance",     tagline: "Repairs Done Right",                  cpm: 14, from: "#0c2340", to: "#1d4ed8" },
  { brand: "HelloTech",         tagline: "On-Demand Tech Support",               cpm: 18, from: "#7c3aed", to: "#6d28d9", qr: true },
  { brand: "ServiceMaster",     tagline: "Making Every Day a Clean Day",         cpm: 16, from: "#0f766e", to: "#0d9488" },
  { brand: "Porch",             tagline: "Get It Done",                          cpm: 14, from: "#f59e0b", to: "#d97706" },
  { brand: "ServPro",           tagline: "Like It Never Even Happened",          cpm: 18, from: "#dc7e00", to: "#d97706" },
  { brand: "Mr. Electric",      tagline: "Electrical Expertise You Can Trust",   cpm: 16, from: "#f59e0b", to: "#92400e" },
  { brand: "Aire Serv",         tagline: "Keeping You Comfortable",              cpm: 16, from: "#0369a1", to: "#0c4a6e" },
  { brand: "TruGreen",          tagline: "Science-Based Lawn Care",              cpm: 18, from: "#14532d", to: "#166534" },

  // ── Travel ───────────────────────────────────────────────────────────────────
  { brand: "Delta Air Lines",   tagline: "Keep Climbing",                        cpm: 42, from: "#cc0000", to: "#991b1b" },
  { brand: "United Airlines",   tagline: "Fly the Friendly Skies",               cpm: 38, from: "#003087", to: "#1d4ed8" },
  { brand: "American Airlines", tagline: "Fly Is a Feeling",                     cpm: 36, from: "#003087", to: "#cc0000", qr: true },
  { brand: "JetBlue",           tagline: "You Above All",                        cpm: 28, from: "#003087", to: "#0369a1" },
  { brand: "Emirates",          tagline: "Fly Better",                           cpm: 65, from: "#cc0000", to: "#9a1c1c" },
  { brand: "British Airways",   tagline: "To Fly. To Serve.",                    cpm: 55, from: "#003087", to: "#cc0000" },
  { brand: "Marriott Bonvoy",   tagline: "Travel Brilliantly",                   cpm: 45, from: "#0c2340", to: "#1e3a5f", qr: true },
  { brand: "Hilton",            tagline: "For the Stay",                         cpm: 42, from: "#003087", to: "#1d4ed8" },
  { brand: "Hyatt",             tagline: "For a World of Understanding",          cpm: 50, from: "#7f1d1d", to: "#b91c1c" },
  { brand: "Four Seasons",      tagline: "Open a World of Discovery",            cpm: 80, from: "#14532d", to: "#166534" },
  { brand: "Ritz-Carlton",      tagline: "Let Us Stay With You",                 cpm: 85, from: "#1c1917", to: "#292524" },
  { brand: "Airbnb",            tagline: "Belong Anywhere",                      cpm: 32, from: "#cc2366", to: "#e91e8c" },
  { brand: "Vrbo",              tagline: "Find Your Happy Place",                cpm: 28, from: "#003087", to: "#1d4ed8" },
  { brand: "Expedia",           tagline: "Made to Travel",                       cpm: 30, from: "#003087", to: "#1d4ed8" },
  { brand: "Booking.com",       tagline: "Making It Easier for Everyone to Experience the World", cpm: 28, from: "#003b96", to: "#1d4ed8" },
  { brand: "Hotels.com",        tagline: "We Know Hotels",                       cpm: 24, from: "#dc2626", to: "#b91c1c" },
  { brand: "Norwegian Cruise",  tagline: "Feel Free",                            cpm: 52, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Celebrity Cruises", tagline: "The Celebrity Experience",             cpm: 58, from: "#0c2340", to: "#1e3a5f" },
  { brand: "Royal Caribbean",   tagline: "Come Seek",                            cpm: 48, from: "#003087", to: "#1d4ed8" },
  { brand: "Kayak",             tagline: "Search One and Done",                  cpm: 22, from: "#dc2626", to: "#ef4444" },
  { brand: "TripAdvisor",       tagline: "Millions of Reviews. One Smart Choice.", cpm: 20, from: "#00aa6c", to: "#16a34a" },
  { brand: "Alaska Airlines",   tagline: "Our Whole Heart Is in Every Flight",   cpm: 32, from: "#003087", to: "#0369a1" },
  { brand: "Southwest",         tagline: "Transfarency",                         cpm: 26, from: "#003087", to: "#dc2626" },
  { brand: "Priceline",         tagline: "Tonight's Hotel, at Tonight's Price",  cpm: 20, from: "#003087", to: "#0ea5e9" },
  { brand: "Sandals Resorts",   tagline: "The Luxury Included Resort",           cpm: 55, from: "#0c4a6e", to: "#0369a1" },

  // ── Insurance ────────────────────────────────────────────────────────────────
  { brand: "State Farm",        tagline: "Like a Good Neighbor",                 cpm: 28, from: "#cc0000", to: "#dc2626" },
  { brand: "Allstate",          tagline: "You're in Good Hands",                 cpm: 26, from: "#003087", to: "#1d4ed8" },
  { brand: "GEICO",             tagline: "15 Minutes Could Save You 15%",        cpm: 22, from: "#16a34a", to: "#059669" },
  { brand: "Progressive",       tagline: "Name Your Price for Car Insurance",    cpm: 20, from: "#003087", to: "#0284c7" },
  { brand: "Farmers",           tagline: "We Know From Experience",              cpm: 24, from: "#cc2200", to: "#dc2626" },
  { brand: "Liberty Mutual",    tagline: "Only Pay for What You Need",           cpm: 22, from: "#f59e0b", to: "#d97706" },
  { brand: "Nationwide",        tagline: "Nationwide Is On Your Side",           cpm: 22, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Travelers",         tagline: "Taking Care of What Matters Most",     cpm: 24, from: "#cc0000", to: "#b91c1c" },
  { brand: "Lemonade",          tagline: "Insurance Built for the Digital Age",  cpm: 26, from: "#ff0084", to: "#db2777" },
  { brand: "Hippo Insurance",   tagline: "Modern Home Insurance",               cpm: 24, from: "#0f766e", to: "#0d9488" },
  { brand: "Amica",             tagline: "Exceptional Service. Award Winning.",  cpm: 26, from: "#003087", to: "#1d4ed8" },
  { brand: "MetLife",           tagline: "You've Got Met Goals",                 cpm: 24, from: "#003087", to: "#0369a1" },
  { brand: "Prudential",        tagline: "For Every Life. For Every Future.",    cpm: 28, from: "#0c2340", to: "#1e3a5f" },
  { brand: "Chubb",             tagline: "Insured. Confident.",                  cpm: 35, from: "#1c1917", to: "#292524" },
  { brand: "USAA Insurance",    tagline: "For Our Members. For Life.",           cpm: 30, from: "#00205b", to: "#003087" },

  // ── QSR ──────────────────────────────────────────────────────────────────────
  { brand: "McDonald's",        tagline: "I'm Lovin' It",                        cpm: 22, from: "#dc2626", to: "#f59e0b" },
  { brand: "Burger King",       tagline: "Have It Your Way",                     cpm: 18, from: "#7c2d12", to: "#c2410c" },
  { brand: "Wendy's",           tagline: "Where's the Beef?",                    cpm: 16, from: "#dc2626", to: "#b91c1c" },
  { brand: "Taco Bell",         tagline: "Live Más",                             cpm: 18, from: "#7c3aed", to: "#6d28d9" },
  { brand: "Chipotle",          tagline: "Food with Integrity",                  cpm: 24, from: "#7c2d12", to: "#92400e" },
  { brand: "Subway",            tagline: "Eat Fresh",                            cpm: 16, from: "#15803d", to: "#f59e0b" },
  { brand: "Domino's",          tagline: "Oh Yes We Did",                        cpm: 18, from: "#003087", to: "#dc2626" },
  { brand: "Pizza Hut",         tagline: "No One Out-Pizzas the Hut",            cpm: 16, from: "#cc0000", to: "#dc2626" },
  { brand: "Dunkin'",           tagline: "America Runs on Dunkin'",              cpm: 20, from: "#f97316", to: "#dc2626" },
  { brand: "Starbucks",         tagline: "It Starts with Your Name",             cpm: 28, from: "#14532d", to: "#166534" },
  { brand: "Chick-fil-A",       tagline: "Eat Mor Chikin",                       cpm: 22, from: "#cc0000", to: "#b91c1c" },
  { brand: "KFC",               tagline: "It's Finger Lickin' Good",             cpm: 16, from: "#dc2626", to: "#c2410c" },
  { brand: "Popeyes",           tagline: "Love That Chicken",                    cpm: 18, from: "#f59e0b", to: "#d97706" },
  { brand: "Shake Shack",       tagline: "Stand for Something Good",             cpm: 26, from: "#14532d", to: "#15803d", qr: true },
  { brand: "Five Guys",         tagline: "Everything Fresh. Nothing Frozen.",    cpm: 20, from: "#dc2626", to: "#c2410c" },
  { brand: "Wingstop",          tagline: "The Wing Experts",                     cpm: 18, from: "#dc2626", to: "#b91c1c" },
  { brand: "Raising Cane's",    tagline: "ONE LOVE.",                            cpm: 20, from: "#f59e0b", to: "#d97706" },
  { brand: "In-N-Out",          tagline: "Quality You Can Taste",                cpm: 24, from: "#cc0000", to: "#dc2626" },
  { brand: "Whataburger",       tagline: "Just Like You Like It",                cpm: 18, from: "#f97316", to: "#dc2626" },
  { brand: "Panera Bread",      tagline: "You Pick Two",                         cpm: 20, from: "#15803d", to: "#0d9488" },
  { brand: "Olive Garden",      tagline: "When You're Here, You're Family",      cpm: 16, from: "#166534", to: "#15803d" },
  { brand: "Applebee's",        tagline: "Eatin' Good in the Neighborhood",      cpm: 12, from: "#7f1d1d", to: "#b91c1c" },
  { brand: "Denny's",           tagline: "America's Diner Is Always Open",       cpm: 10, from: "#ca8a04", to: "#d97706" },
  { brand: "Dairy Queen",       tagline: "Fan Food Not Fast Food",               cpm: 14, from: "#cc0000", to: "#dc2626" },
  { brand: "Sonic",             tagline: "This Is How You Sonic",                cpm: 15, from: "#dc2626", to: "#f59e0b" },

  // ── Automotive ───────────────────────────────────────────────────────────────
  { brand: "Ford",              tagline: "Built Ford Tough",                     cpm: 34, from: "#003087", to: "#1d4ed8" },
  { brand: "Chevrolet",         tagline: "Find New Roads",                       cpm: 30, from: "#f59e0b", to: "#d97706" },
  { brand: "Toyota",            tagline: "Let's Go Places",                      cpm: 32, from: "#cc0000", to: "#b91c1c" },
  { brand: "Honda",             tagline: "The Power of Dreams",                  cpm: 28, from: "#cc0000", to: "#dc2626" },
  { brand: "Hyundai",           tagline: "New Thinking. New Possibilities.",     cpm: 26, from: "#1d4ed8", to: "#2563eb" },
  { brand: "Kia",               tagline: "Movement That Inspires",               cpm: 24, from: "#cc0000", to: "#dc2626" },
  { brand: "Volkswagen",        tagline: "Das Auto",                             cpm: 28, from: "#003087", to: "#1d4ed8" },
  { brand: "Subaru",            tagline: "Love. It's What Makes Subaru, Subaru.", cpm: 26, from: "#003087", to: "#1d4ed8" },
  { brand: "Lexus",             tagline: "Experience Amazing",                   cpm: 52, from: "#1c1917", to: "#292524" },
  { brand: "Acura",             tagline: "Precision Crafted Performance",        cpm: 42, from: "#cc0000", to: "#b91c1c" },
  { brand: "Infiniti",          tagline: "Inspired Performance",                 cpm: 44, from: "#1c1917", to: "#292524" },
  { brand: "Lincoln",           tagline: "The Power of Sanctuary",               cpm: 48, from: "#0f172a", to: "#1e293b" },
  { brand: "Cadillac",          tagline: "Be Bold",                              cpm: 50, from: "#1c1917", to: "#0f172a" },
  { brand: "Jeep",              tagline: "Go Anywhere. Do Anything.",            cpm: 32, from: "#14532d", to: "#166534" },
  { brand: "Ram Trucks",        tagline: "Guts. Glory. Ram.",                    cpm: 28, from: "#7f1d1d", to: "#b91c1c" },
  { brand: "CarMax",            tagline: "The Way Car Buying Should Be",         cpm: 22, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Carvana",           tagline: "Buy & Sell Cars Online",               cpm: 20, from: "#003087", to: "#0369a1" },
  { brand: "AutoNation",        tagline: "Drive Smart. Buy Smart.",              cpm: 20, from: "#dc2626", to: "#b91c1c" },
  { brand: "Goodyear",          tagline: "Get There with Goodyear",              cpm: 18, from: "#003087", to: "#1d4ed8" },
  { brand: "Bridgestone",       tagline: "Your Journey, Our Passion",            cpm: 20, from: "#cc0000", to: "#dc2626" },

  // ── Grocery ───────────────────────────────────────────────────────────────────
  { brand: "Whole Foods",       tagline: "Quality Standards You Can Trust",      cpm: 22, from: "#14532d", to: "#166534" },
  { brand: "Trader Joe's",      tagline: "Fearless Flyer",                       cpm: 20, from: "#dc2626", to: "#b91c1c" },
  { brand: "Kroger",            tagline: "Fresh for Everyone",                   cpm: 18, from: "#003087", to: "#1d4ed8" },
  { brand: "Publix",            tagline: "Where Shopping Is a Pleasure",         cpm: 20, from: "#007848", to: "#16a34a" },
  { brand: "H-E-B",             tagline: "Here Everything's Better",             cpm: 20, from: "#cc0000", to: "#dc2626" },
  { brand: "Aldi",              tagline: "Good Food. Every Day.",                cpm: 16, from: "#003087", to: "#dc2626" },
  { brand: "Costco",            tagline: "Quality Products at Lower Prices",     cpm: 22, from: "#dc2626", to: "#b91c1c" },
  { brand: "Sprouts",           tagline: "Healthy Living for Less",              cpm: 20, from: "#14532d", to: "#15803d", qr: true },
  { brand: "Thrive Market",     tagline: "Organic & Healthy at Wholesale Prices", cpm: 22, from: "#0f766e", to: "#0d9488" },
  { brand: "FreshDirect",       tagline: "Fresh. Fast. Delivered.",              cpm: 20, from: "#dc2626", to: "#f59e0b" },
  { brand: "Sam's Club",        tagline: "Saving You Money Since 1983",          cpm: 18, from: "#003087", to: "#f59e0b" },
  { brand: "Meijer",            tagline: "Simply Great",                         cpm: 16, from: "#cc0000", to: "#dc2626" },
  { brand: "Giant Food",        tagline: "Savings You Can Taste",                cpm: 15, from: "#cc0000", to: "#b91c1c" },
  { brand: "Albertsons",        tagline: "Inspire Well-Being",                   cpm: 16, from: "#003087", to: "#1d4ed8" },
  { brand: "Food Lion",         tagline: "Easy, Fresh and Affordable",           cpm: 14, from: "#cc0000", to: "#dc2626" },

  // ── Tech ──────────────────────────────────────────────────────────────────────
  { brand: "Apple",             tagline: "Think Different",                      cpm: 52, from: "#1c1917", to: "#292524" },
  { brand: "Samsung",           tagline: "Do What You Can't",                    cpm: 44, from: "#003087", to: "#1d4ed8" },
  { brand: "Google",            tagline: "Search. Discover. Create.",            cpm: 48, from: "#003087", to: "#0369a1" },
  { brand: "Microsoft",         tagline: "Empowering Every Person on the Planet", cpm: 45, from: "#003087", to: "#0ea5e9" },
  { brand: "Amazon",            tagline: "Work Hard. Have Fun. Make History.",   cpm: 38, from: "#f59e0b", to: "#d97706" },
  { brand: "Sony",              tagline: "Make Believe",                         cpm: 36, from: "#1c1917", to: "#292524" },
  { brand: "LG",                tagline: "Life's Good",                          cpm: 30, from: "#cc0000", to: "#b91c1c" },
  { brand: "Dell",              tagline: "The Power to Do More",                 cpm: 28, from: "#003087", to: "#1d4ed8" },
  { brand: "Best Buy",          tagline: "Let's Talk About What's Possible",     cpm: 26, from: "#003087", to: "#f59e0b", qr: true },
  { brand: "Adobe",             tagline: "Creativity for All",                   cpm: 40, from: "#cc0000", to: "#dc2626" },
  { brand: "Salesforce",        tagline: "The #1 AI CRM",                        cpm: 48, from: "#003087", to: "#0369a1" },
  { brand: "Zoom",              tagline: "One Platform to Connect",              cpm: 34, from: "#2563eb", to: "#1d4ed8" },
  { brand: "Slack",             tagline: "Where Work Happens",                   cpm: 36, from: "#4f46e5", to: "#6d28d9" },
  { brand: "Dropbox",           tagline: "Work Smarter. Not Harder.",            cpm: 28, from: "#0369a1", to: "#0284c7" },
  { brand: "GitHub",            tagline: "Where the World Builds Software",      cpm: 40, from: "#111827", to: "#1f2937" },
  { brand: "Canva",             tagline: "Design Made Easy",                     cpm: 28, from: "#00c4cc", to: "#7c3aed" },
  { brand: "Notion",            tagline: "Your Wiki, Docs & Projects. Together.", cpm: 30, from: "#1c1917", to: "#292524" },
  { brand: "HubSpot",           tagline: "Grow Better",                          cpm: 36, from: "#f97316", to: "#ea580c" },
  { brand: "Shopify",           tagline: "Making Commerce Better for Everyone",  cpm: 38, from: "#14532d", to: "#15803d" },
  { brand: "Monday.com",        tagline: "Work the Way You Want",                cpm: 32, from: "#cc2200", to: "#dc2626" },

  // ── Retail / Fashion ─────────────────────────────────────────────────────────
  { brand: "Nike",              tagline: "Just Do It",                           cpm: 44, from: "#111827", to: "#1f2937" },
  { brand: "Adidas",            tagline: "Impossible Is Nothing",                cpm: 40, from: "#1c1917", to: "#292524" },
  { brand: "Lululemon",         tagline: "This Is Yoga",                         cpm: 48, from: "#292524", to: "#44403c" },
  { brand: "Nordstrom",         tagline: "Reinvent Yourself",                    cpm: 36, from: "#111827", to: "#1f2937" },
  { brand: "Macy's",            tagline: "The Magic of Macy's",                  cpm: 22, from: "#cc0000", to: "#dc2626" },
  { brand: "Bloomingdale's",    tagline: "Like No Other Store in the World",     cpm: 40, from: "#1c1917", to: "#292524" },
  { brand: "Saks Fifth Avenue", tagline: "Want It. Own It.",                     cpm: 55, from: "#0f172a", to: "#1e293b", qr: true },
  { brand: "Neiman Marcus",     tagline: "Only at Neiman's",                     cpm: 58, from: "#1c1917", to: "#292524" },
  { brand: "Anthropologie",     tagline: "We the Free",                          cpm: 32, from: "#4c1d95", to: "#6d28d9" },
  { brand: "Urban Outfitters",  tagline: "Live Outside the Lines",               cpm: 22, from: "#1c1917", to: "#3b4252" },
  { brand: "Zara",              tagline: "Love Your Curves",                     cpm: 28, from: "#1c1917", to: "#292524" },
  { brand: "H&M",               tagline: "Fashion at the Best Price",            cpm: 16, from: "#cc0000", to: "#b91c1c" },
  { brand: "Ralph Lauren",      tagline: "A Heritage of Americana",              cpm: 50, from: "#003087", to: "#1d4ed8" },
  { brand: "Tommy Hilfiger",    tagline: "Tommy X You",                          cpm: 36, from: "#cc0000", to: "#003087" },
  { brand: "Calvin Klein",      tagline: "Everyone in CK",                       cpm: 40, from: "#1c1917", to: "#292524" },
  { brand: "Michael Kors",      tagline: "Jet Set",                              cpm: 44, from: "#1c1917", to: "#292524" },
  { brand: "Coach",             tagline: "Courage to Be Real",                   cpm: 46, from: "#78350f", to: "#92400e" },
  { brand: "Kate Spade",        tagline: "Live Colorfully",                      cpm: 42, from: "#db2777", to: "#ec4899" },
  { brand: "Tory Burch",        tagline: "Live Colorfully. Simply. Well.",       cpm: 44, from: "#14532d", to: "#166534" },
  { brand: "Kohl's",            tagline: "Save Your Money for the Things You Love", cpm: 15, from: "#b91c1c", to: "#ea580c" },

  // ── Wellness ──────────────────────────────────────────────────────────────────
  { brand: "Peloton",           tagline: "Motivation That Moves You",            cpm: 38, from: "#cc0000", to: "#dc2626" },
  { brand: "Equinox",           tagline: "It's Not Fitness. It's Life.",         cpm: 55, from: "#1c1917", to: "#292524" },
  { brand: "ClassPass",         tagline: "Every Workout. Everywhere.",           cpm: 28, from: "#7c3aed", to: "#6d28d9" },
  { brand: "Calm",              tagline: "Find Your Calm",                       cpm: 22, from: "#0c4a6e", to: "#0369a1" },
  { brand: "Headspace",         tagline: "Be Kind to Your Mind",                 cpm: 20, from: "#f97316", to: "#ea580c" },
  { brand: "Eight Sleep",       tagline: "Sleep Fit",                            cpm: 45, from: "#0f172a", to: "#1e293b", qr: true },
  { brand: "Theragun",          tagline: "Your Body Has Needs",                  cpm: 38, from: "#1c1917", to: "#292524" },
  { brand: "Hydrow",            tagline: "Live the Water",                       cpm: 36, from: "#0c4a6e", to: "#0369a1" },
  { brand: "WHOOP",             tagline: "Unlock Your Performance",              cpm: 42, from: "#111827", to: "#1f2937" },
  { brand: "Oura Ring",         tagline: "Know Yourself Better",                 cpm: 44, from: "#1c1917", to: "#292524" },
  { brand: "SoulCycle",         tagline: "Find Your Soul",                       cpm: 38, from: "#f59e0b", to: "#d97706" },
  { brand: "Mindbody",          tagline: "Discover Wellness Near You",           cpm: 22, from: "#0f766e", to: "#0d9488" },
  { brand: "LifeTime Fitness",  tagline: "Where Healthy Takes Hold",             cpm: 30, from: "#003087", to: "#1d4ed8" },
  { brand: "Mirror",            tagline: "The Nearly Invisible Home Gym",        cpm: 40, from: "#1c1917", to: "#292524" },
  { brand: "Restore Hyper",     tagline: "Recover Faster. Perform Better.",      cpm: 32, from: "#0c4a6e", to: "#0369a1" },

  // ── Real Estate ───────────────────────────────────────────────────────────────
  { brand: "Zillow",            tagline: "Find the Perfect Home",                cpm: 28, from: "#003087", to: "#0369a1" },
  { brand: "Realtor.com",       tagline: "Home of Home Search",                  cpm: 26, from: "#cc0000", to: "#dc2626" },
  { brand: "Redfin",            tagline: "A Better Way to Buy & Sell Homes",     cpm: 24, from: "#cc0000", to: "#b91c1c" },
  { brand: "Opendoor",          tagline: "Buy and Sell on Your Timeline",        cpm: 28, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Compass",           tagline: "Find Your Place",                      cpm: 36, from: "#1c1917", to: "#292524" },
  { brand: "Coldwell Banker",   tagline: "Expect Better",                        cpm: 22, from: "#003087", to: "#1d4ed8" },
  { brand: "RE/MAX",            tagline: "Nobody Sells More Real Estate",        cpm: 24, from: "#cc0000", to: "#f59e0b" },
  { brand: "Keller Williams",   tagline: "Everybody Wins",                       cpm: 22, from: "#cc0000", to: "#c2410c" },
  { brand: "Rocket Mortgage",   tagline: "Push Button. Get Mortgage.",           cpm: 30, from: "#cc0000", to: "#dc2626" },
  { brand: "Trulia",            tagline: "A Home Is a Big Deal. So Are We.",     cpm: 24, from: "#003087", to: "#0ea5e9" },
  { brand: "Fundrise",          tagline: "Real Estate Investing for Everyone",   cpm: 28, from: "#0f766e", to: "#0d9488" },
  { brand: "Arrived",           tagline: "Invest in Rental Properties",          cpm: 26, from: "#14532d", to: "#166534" },
  { brand: "CoStar",            tagline: "The Global Leader in Real Estate",     cpm: 38, from: "#003087", to: "#1d4ed8" },
  { brand: "LoopNet",           tagline: "Commercial Real Estate Listings",      cpm: 30, from: "#1d4ed8", to: "#2563eb" },
  { brand: "Knock",             tagline: "Trade Up to Your Dream Home",          cpm: 26, from: "#7c3aed", to: "#6d28d9" },

  // ── Delivery ──────────────────────────────────────────────────────────────────
  { brand: "DoorDash",          tagline: "Every Flavor Welcome",                 cpm: 28, from: "#cc0000", to: "#dc2626" },
  { brand: "Uber Eats",         tagline: "Tonight, I'll Have…",                  cpm: 26, from: "#1c1917", to: "#292524" },
  { brand: "Grubhub",           tagline: "We Had You at Food",                   cpm: 22, from: "#f97316", to: "#dc2626" },
  { brand: "Instacart",         tagline: "Get Groceries in an Hour",             cpm: 24, from: "#14532d", to: "#16a34a" },
  { brand: "FedEx",             tagline: "When It Absolutely Has to Be There",   cpm: 28, from: "#4f46e5", to: "#7c2d12" },
  { brand: "UPS",               tagline: "What Can Brown Do for You?",           cpm: 26, from: "#78350f", to: "#92400e" },
  { brand: "Amazon Logistics",  tagline: "Delivering Your Tomorrow",             cpm: 32, from: "#f59e0b", to: "#1c1917" },
  { brand: "Gopuff",            tagline: "Instant Commerce",                     cpm: 20, from: "#4f46e5", to: "#7c3aed", qr: true },
  { brand: "Shipt",             tagline: "Groceries Delivered in an Hour",       cpm: 22, from: "#cc0000", to: "#dc2626" },
  { brand: "Postmates",         tagline: "We Bring It",                          cpm: 18, from: "#111827", to: "#1f2937" },

  // ── Entertainment ─────────────────────────────────────────────────────────────
  { brand: "Netflix",           tagline: "Watch What You Love",                  cpm: 38, from: "#cc0000", to: "#dc2626" },
  { brand: "Disney+",           tagline: "The Magic of Disney, Pixar, Marvel",   cpm: 42, from: "#003087", to: "#1d4ed8" },
  { brand: "HBO Max",           tagline: "It's Time for HBO",                    cpm: 44, from: "#4f46e5", to: "#6d28d9" },
  { brand: "Hulu",              tagline: "It's a Bird. It's a Plane. It's TV.",  cpm: 36, from: "#14532d", to: "#15803d" },
  { brand: "Peacock",           tagline: "Stream Now",                           cpm: 28, from: "#0369a1", to: "#0284c7" },
  { brand: "Apple TV+",         tagline: "Original Stories. Original Voices.",   cpm: 40, from: "#1c1917", to: "#292524" },
  { brand: "Spotify",           tagline: "Music for Everyone",                   cpm: 32, from: "#14532d", to: "#15803d" },
  { brand: "Apple Music",       tagline: "All the Ways You Listen",              cpm: 35, from: "#1c1917", to: "#292524" },
  { brand: "SiriusXM",          tagline: "Everything You Love About Radio",      cpm: 26, from: "#4f46e5", to: "#003087" },
  { brand: "AMC Theatres",      tagline: "Passion for What's Possible",          cpm: 24, from: "#cc0000", to: "#b91c1c" },
  { brand: "Fandango",          tagline: "The Ultimate Movie Ticket",            cpm: 22, from: "#f97316", to: "#dc2626" },
  { brand: "Ticketmaster",      tagline: "All Your Events. One Place.",          cpm: 30, from: "#003087", to: "#1d4ed8" },
  { brand: "Live Nation",       tagline: "The Biggest Shows on Earth",           cpm: 36, from: "#cc0000", to: "#b91c1c", qr: true },
  { brand: "YouTube Premium",   tagline: "More YouTube. Less Interruption.",     cpm: 28, from: "#cc0000", to: "#dc2626" },
  { brand: "Paramount+",        tagline: "Peak Streaming. Original Voices.",     cpm: 30, from: "#003087", to: "#1d4ed8" },

  // ── Telecom ───────────────────────────────────────────────────────────────────
  { brand: "Verizon",           tagline: "The Network More People Rely On",      cpm: 38, from: "#cc0000", to: "#b91c1c" },
  { brand: "AT&T",              tagline: "Your World Delivered",                 cpm: 35, from: "#003087", to: "#1d4ed8" },
  { brand: "T-Mobile",          tagline: "Un-carrier. Changing Wireless.",       cpm: 32, from: "#cc007c", to: "#db2777" },
  { brand: "Spectrum",          tagline: "Your Gateway to the Connected World",  cpm: 24, from: "#003087", to: "#0369a1" },
  { brand: "Comcast Xfinity",   tagline: "The Future of Awesome",                cpm: 28, from: "#cc0000", to: "#1d4ed8" },
  { brand: "Mint Mobile",       tagline: "Premium Wireless for $15/mo",          cpm: 22, from: "#0f766e", to: "#0d9488", qr: true },
  { brand: "Google Fi",         tagline: "Fi. Phone Plans That Move with You.",  cpm: 28, from: "#003087", to: "#dc2626" },
  { brand: "Cricket Wireless",  tagline: "More Happy. Less Worry.",              cpm: 18, from: "#14532d", to: "#16a34a" },
  { brand: "Boost Mobile",      tagline: "Nationwide Coverage. Unlimited Data.", cpm: 16, from: "#dc7e00", to: "#d97706" },
  { brand: "Optimum",           tagline: "Big Picture Value",                    cpm: 20, from: "#cc0000", to: "#dc2626" },

  // ── Food / Beverage ───────────────────────────────────────────────────────────
  { brand: "Coca-Cola",         tagline: "Open Happiness",                       cpm: 32, from: "#cc0000", to: "#dc2626" },
  { brand: "Pepsi",             tagline: "That's What I Like",                   cpm: 28, from: "#003087", to: "#1d4ed8" },
  { brand: "Red Bull",          tagline: "Gives You Wings",                      cpm: 30, from: "#cc0000", to: "#f59e0b" },
  { brand: "Monster Energy",    tagline: "Unleash the Beast",                    cpm: 24, from: "#14532d", to: "#1c1917" },
  { brand: "Celsius",           tagline: "Live Fit",                             cpm: 22, from: "#cc0000", to: "#dc2626" },
  { brand: "Gatorade",          tagline: "Win from Within",                      cpm: 26, from: "#f59e0b", to: "#7c2d12" },
  { brand: "Liquid Death",      tagline: "Murder Your Thirst",                   cpm: 20, from: "#1c1917", to: "#292524" },
  { brand: "Poppi",             tagline: "The Future of Soda",                   cpm: 18, from: "#ec4899", to: "#db2777" },
  { brand: "Olipop",            tagline: "A New Kind of Soda",                   cpm: 18, from: "#f59e0b", to: "#d97706" },
  { brand: "La Croix",          tagline: "Naturally Essenced",                   cpm: 14, from: "#0369a1", to: "#0284c7" },
  { brand: "Vitaminwater",      tagline: "Go Hydrate Yourself",                  cpm: 16, from: "#0284c7", to: "#7c3aed" },
  { brand: "Spindrift",         tagline: "Real Fruit. Real Sparkling.",          cpm: 15, from: "#0f766e", to: "#dc2626" },
  { brand: "Nespresso",         tagline: "What Else?",                           cpm: 38, from: "#1c1917", to: "#292524", qr: true },
  { brand: "Keurig",            tagline: "Wake Up to What You Love",             cpm: 22, from: "#7c2d12", to: "#92400e" },
  { brand: "Chobani",           tagline: "Nothing But Good",                     cpm: 16, from: "#003087", to: "#dc2626" },

  // ── Beauty ────────────────────────────────────────────────────────────────────
  { brand: "Sephora",           tagline: "We Belong to Something Beautiful",     cpm: 38, from: "#1c1917", to: "#292524" },
  { brand: "Ulta Beauty",       tagline: "All Things Beauty. All in One Place.", cpm: 32, from: "#cc007c", to: "#db2777" },
  { brand: "L'Oréal Paris",     tagline: "Because You're Worth It",              cpm: 36, from: "#cc0000", to: "#b91c1c" },
  { brand: "Maybelline",        tagline: "Maybe She's Born With It",             cpm: 28, from: "#cc0050", to: "#db2777" },
  { brand: "Fenty Beauty",      tagline: "Beauty for All",                       cpm: 40, from: "#1c1917", to: "#4c1d95" },
  { brand: "Charlotte Tilbury", tagline: "Magic in Every Bottle",                cpm: 48, from: "#7c2d12", to: "#9a3412" },
  { brand: "NARS",              tagline: "Your Skin. But Better.",               cpm: 44, from: "#1c1917", to: "#292524" },
  { brand: "Too Faced",         tagline: "Better Than Sex",                      cpm: 34, from: "#ec4899", to: "#db2777" },
  { brand: "Urban Decay",       tagline: "Don't Be Afraid",                      cpm: 32, from: "#4c1d95", to: "#6d28d9" },
  { brand: "Clinique",          tagline: "Great Skin Doesn't Just Happen",       cpm: 36, from: "#0f766e", to: "#0d9488" },
  { brand: "Estée Lauder",      tagline: "Bringing the Best to Everyone",        cpm: 44, from: "#1c1917", to: "#292524" },
  { brand: "MAC",               tagline: "All Ages, All Races, All Genders",     cpm: 38, from: "#1c1917", to: "#292524" },
  { brand: "NYX Professional",  tagline: "Worth It",                             cpm: 22, from: "#0f172a", to: "#4c1d95", qr: true },
  { brand: "Glossier",          tagline: "Skin First. Makeup Second.",           cpm: 30, from: "#ec4899", to: "#f9a8d4" },
  { brand: "e.l.f. Cosmetics",  tagline: "e.l.f. For Every Eye, Lip & Face",    cpm: 16, from: "#0f766e", to: "#14532d" },

  // ── Education ─────────────────────────────────────────────────────────────────
  { brand: "Duolingo",          tagline: "Learn a Language for Free",            cpm: 20, from: "#14532d", to: "#16a34a" },
  { brand: "Coursera",          tagline: "Learn Without Limits",                 cpm: 26, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Udemy",             tagline: "Learn Anything. Become Anything.",     cpm: 22, from: "#4f46e5", to: "#6d28d9" },
  { brand: "MasterClass",       tagline: "Learn from the Best",                  cpm: 38, from: "#1c1917", to: "#292524" },
  { brand: "LinkedIn Learning", tagline: "Skills for Today. Jobs for Tomorrow.", cpm: 32, from: "#0a3561", to: "#0077b5" },
  { brand: "Khan Academy",      tagline: "A Free World-Class Education for All", cpm: 14, from: "#14532d", to: "#16a34a" },
  { brand: "Chegg",             tagline: "Always Students First",                cpm: 18, from: "#f97316", to: "#ea580c" },
  { brand: "Princeton Review",  tagline: "Ace It",                               cpm: 20, from: "#cc0000", to: "#dc2626" },
  { brand: "Kaplan",            tagline: "Test Prep for Success",                cpm: 22, from: "#003087", to: "#1d4ed8" },
  { brand: "Skillshare",        tagline: "Explore Your Creativity",              cpm: 24, from: "#0f766e", to: "#0d9488" },

  // ── Pet Care ──────────────────────────────────────────────────────────────────
  { brand: "Chewy",             tagline: "Pet-Happiness, Delivered",             cpm: 22, from: "#003087", to: "#1d4ed8" },
  { brand: "PetSmart",          tagline: "Where Pets Are Family",                cpm: 18, from: "#003087", to: "#1d4ed8" },
  { brand: "Petco",             tagline: "The Power of Together",                cpm: 18, from: "#003087", to: "#0369a1" },
  { brand: "BarkBox",           tagline: "Joy in Every Box",                     cpm: 20, from: "#f97316", to: "#ea580c", qr: true },
  { brand: "Rover",             tagline: "Dog Sitting Your Dog Will Love",       cpm: 18, from: "#14532d", to: "#16a34a" },
  { brand: "Wag",               tagline: "Happy Dog. Happy Life.",               cpm: 16, from: "#14532d", to: "#f59e0b" },
  { brand: "The Farmer's Dog",  tagline: "Real Food. Real Good.",                cpm: 28, from: "#0f766e", to: "#0d9488" },
  { brand: "Hill's Science Diet", tagline: "Vet's #1 Recommended",              cpm: 20, from: "#003087", to: "#f59e0b" },
  { brand: "Blue Buffalo",      tagline: "Love Them Like Family. Feed Them Like Family.", cpm: 18, from: "#003087", to: "#1d4ed8" },
  { brand: "Royal Canin",       tagline: "Nutritional Precision",                cpm: 22, from: "#cc0000", to: "#dc2626" },

  // ── Business Services ──────────────────────────────────────────────────────────
  { brand: "QuickBooks",        tagline: "Backing You",                          cpm: 28, from: "#14532d", to: "#16a34a" },
  { brand: "Square",            tagline: "Every Business Runs Better",          cpm: 26, from: "#1c1917", to: "#292524" },
  { brand: "Mailchimp",         tagline: "Marketing That Sticks",               cpm: 24, from: "#f59e0b", to: "#d97706" },
  { brand: "Zendesk",           tagline: "Beautiful Customer Experiences",      cpm: 28, from: "#14532d", to: "#0f766e" },
  { brand: "DocuSign",          tagline: "There's a Better Way to Agreement",   cpm: 30, from: "#003087", to: "#1d4ed8", qr: true },
  { brand: "Asana",             tagline: "Your Team in Sync",                   cpm: 28, from: "#f97316", to: "#db2777" },
  { brand: "Calendly",          tagline: "Scheduling Meetings Made Easy",       cpm: 24, from: "#003087", to: "#0369a1" },
  { brand: "Semrush",           tagline: "Grow Your Online Visibility",         cpm: 30, from: "#f97316", to: "#dc2626" },
  { brand: "Wix",               tagline: "Build a Website You're Proud Of",     cpm: 20, from: "#0f172a", to: "#1e293b" },
  { brand: "Squarespace",       tagline: "Make It Stand Out",                   cpm: 24, from: "#1c1917", to: "#292524" },
  { brand: "Webflow",           tagline: "Build Better Business Websites",      cpm: 28, from: "#003087", to: "#1d4ed8" },
  { brand: "Typeform",          tagline: "Ask Better Questions",                cpm: 22, from: "#7c3aed", to: "#6d28d9" },
  { brand: "Airtable",          tagline: "Create Connected Apps",               cpm: 30, from: "#f97316", to: "#7c3aed" },
  { brand: "Figma",             tagline: "Design Together",                     cpm: 34, from: "#f97316", to: "#db2777" },
  { brand: "Zapier",            tagline: "Automate Your Work",                  cpm: 28, from: "#f97316", to: "#dc2626" },
];

// Battery charges at this rate (% per second) in demo
const CHARGE_RATE = 0.10;

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
  const [locationCtx, setLocationCtx] = useState<"highway" | "urban" | "suburban" | "shopping" | "airport" | "stadium" | "hospital" | "office_park" | "school">("highway");
  const [batteryCtx, setBatteryCtx] = useState<"100" | "90" | "60" | "40" | "20" | "15" | "5">("60");
  const [venueCtx, setVenueCtx] = useState<"luxury_retail" | "shopping_mall" | "grocery" | "downtown" | "airport" | "highway_rest" | "stadium" | "hotel" | "office" | "university" | "hospital">("luxury_retail");
  const [msrpCtx, setMsrpCtx] = useState<"200k+" | "120k+" | "80k-120k" | "40k-80k" | "under-40k">("120k+");
  const [dwellCtx, setDwellCtx] = useState<"10" | "15" | "30" | "45" | "60" | "90">("45");
  const [weatherCtx, setWeatherCtx] = useState<"sunny" | "rainy" | "cloudy">("sunny");
  const [timeCtx, setTimeCtx] = useState<"morning" | "afternoon" | "evening">("morning");
  const [trafficCtx, setTrafficCtx] = useState<"low" | "medium" | "high">("low");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [playlistSlot, setPlaylistSlot] = useState(0);
  const [playlistPlaying, setPlaylistPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const terminalTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const terminalBoxRef = useRef<HTMLDivElement>(null);
  const playlistTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playlistItemRef = useRef<Array<{ type: string; label: string; sublabel: string }>>([]);

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
    const venueLabel = venueCtx === "luxury_retail" ? "Luxury Retail" : venueCtx === "shopping_mall" ? "Shopping Mall" : venueCtx === "grocery" ? "Grocery" : venueCtx === "downtown" ? "Downtown" : venueCtx === "airport" ? "Airport" : venueCtx === "highway_rest" ? "Highway Rest Stop" : venueCtx === "stadium" ? "Stadium" : venueCtx === "hotel" ? "Hotel" : venueCtx === "office" ? "Office Park" : venueCtx === "university" ? "University" : "Hospital";
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

  // Session playlist cycling
  useEffect(() => {
    if (playlistTimerRef.current) clearInterval(playlistTimerRef.current);
    if (!playlistPlaying) return;
    playlistTimerRef.current = setInterval(() => {
      setPlaylistSlot(s => {
        const next = (s + 1) % 4;
        const item = playlistItemRef.current[next];
        if (item) {
          const typeLabel = { priority: "Priority", utility: "Utility Info", contextual: "Contextual", brand: "Network" }[item.type] ?? item.type;
          setTerminalLines(prev => [...prev, `[SESSION] Slot ${next + 1} → ${typeLabel}: ${item.label} (${item.sublabel})`]);
        }
        return next;
      });
    }, 8000);
    return () => { if (playlistTimerRef.current) clearInterval(playlistTimerRef.current); };
  }, [playlistPlaying]);

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

  // ── Session Playlist ────────────────────────────────────────────────────────
  const PRIORITY_MAP: Record<string, [string, string]> = {
    tesla: ["Apple", "$42"], porsche: ["Capital One", "$45"], lucid: ["Maybelline", "$50"],
    bmw: ["Oakley", "$38"], ford: ["Nike", "$34"], rivian: ["Rivian", "$32"],
    genesis: ["Planet Fitness", "$22"], cadillac: ["Nike", "$48"],
    jaguar: ["XFINITY", "$40"], polestar: ["T-Mobile", "$30"], volvo: ["Rocket + Redfin", "$35"],
  };
  const [priorityBrand, priorityCpm] = (() => {
    if (weatherCtx === "rainy") return ["Starbucks", "$38"];
    if (locationCtx === "school") return ["Instacart", "$20"];
    if (batteryCtx === "15" || batteryCtx === "5") return ["Uber Eats", "$28"];
    return PRIORITY_MAP[carMake] ?? ["Amazon", "$18"];
  })();
  const venueAd = VENUE_CTX_ADS[venueCtx] ?? VENUE_CTX_ADS.highway_rest;
  const sessionPlaylist = [
    { slot: 0, type: "priority",   label: priorityBrand,     sublabel: `${priorityCpm} CPM`,       accent: "yellow" },
    { slot: 1, type: "utility",    label: "Battery Status",  sublabel: `${batteryCtx}% SoC`,       accent: "teal"   },
    { slot: 2, type: "contextual", label: venueAd.brand,     sublabel: `$${venueAd.cpm} CPM`,      accent: "violet" },
    { slot: 3, type: "brand",      label: "VideoEV",         sublabel: "Network Spot",             accent: "slate"  },
  ];
  playlistItemRef.current = sessionPlaylist;

  // ─── START GATE ───────────────────────────────────────────────────────────
  if (stage === "start") {
    return (
      <div className="relative h-screen w-screen bg-slate-950 flex flex-col items-center justify-center select-none">
        {/* Full-screen tap target — button element ensures reliable iOS touch handling */}
        <button
          type="button"
          className="absolute inset-0 w-full h-full"
          onClick={() => setStage("connect")}
          aria-label="Tap to start demo"
        />

        {/* Content — z-10 so it sits above the button visually but pointer-events pass through */}
        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <img src="/videoev-icon-clear.svg" alt="VideoEV" className="w-28 h-28 mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-white mb-3">Video<span className="text-teal-400">EV</span></h1>
          <p className="text-slate-400 text-lg">Tap anywhere to start demo</p>
        </div>

        {/* Vehicle selector — z-20 so it intercepts its own taps, not the full-screen button */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-2">
          <p className="text-slate-600 text-xs tracking-widest uppercase">Select vehicle</p>
          <select
            value={vehicle.make}
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

        {/* CPO Sandbox link */}
        <a
          href="/plugin/demo"
          className="absolute top-4 right-4 z-20 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          CPO Sandbox →
        </a>
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
                onChange={e => setLocationCtx(e.target.value as "highway" | "urban" | "suburban" | "shopping" | "airport" | "stadium" | "hospital" | "office_park" | "school")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="highway">Highway</option>
                <option value="urban">Urban</option>
                <option value="suburban">Suburban</option>
                <option value="shopping">Shopping District</option>
                <option value="airport">Airport</option>
                <option value="stadium">Stadium / Arena</option>
                <option value="hospital">Hospital</option>
                <option value="office_park">Office Park</option>
                <option value="school">School Zone</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Battery</span>
              <select
                value={batteryCtx}
                onChange={e => setBatteryCtx(e.target.value as "100" | "90" | "60" | "40" | "20" | "15" | "5")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="100">100%</option>
                <option value="90">90%</option>
                <option value="60">60%</option>
                <option value="40">40%</option>
                <option value="20">20%</option>
                <option value="15">15% ⚡</option>
                <option value="5">5% 🔴</option>
              </select>
            </div>
          </div>
          <div className="mb-2">
            <span className="eyebrow text-slate-500 block mb-1">Venue Type</span>
            <select
              value={venueCtx}
              onChange={e => setVenueCtx(e.target.value as "luxury_retail" | "shopping_mall" | "grocery" | "downtown" | "airport" | "highway_rest" | "stadium" | "hotel" | "office" | "university" | "hospital")}
              className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
            >
              <option value="luxury_retail">Luxury Retail</option>
              <option value="shopping_mall">Shopping Mall</option>
              <option value="grocery">Grocery</option>
              <option value="downtown">Downtown</option>
              <option value="airport">Airport</option>
              <option value="hotel">Hotel</option>
              <option value="office">Office Park</option>
              <option value="university">University</option>
              <option value="stadium">Stadium / Arena</option>
              <option value="hospital">Hospital</option>
              <option value="highway_rest">Highway Rest Stop</option>
            </select>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">MSRP Proxy</span>
              <select
                value={msrpCtx}
                onChange={e => setMsrpCtx(e.target.value as "200k+" | "120k+" | "80k-120k" | "40k-80k" | "under-40k")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="200k+">$200k+ (Ultra)</option>
                <option value="120k+">$120k+</option>
                <option value="80k-120k">$80k–$120k</option>
                <option value="40k-80k">$40k–$80k</option>
                <option value="under-40k">Under $40k</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="eyebrow text-slate-500 block mb-1">Est. Dwell</span>
              <select
                value={dwellCtx}
                onChange={e => setDwellCtx(e.target.value as "10" | "15" | "30" | "45" | "60" | "90")}
                className="w-full bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="10">10 mins</option>
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
                <option value="60">60 mins</option>
                <option value="90">90 mins</option>
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
                  line.startsWith("[SESSION]") ? "text-yellow-300" :
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
            {/* ── Playlist override ── */}
            {playlistPlaying && playlistSlot === 0 && (
              <VideoAd key={`pl-0-${adTagPath}`} src={adTagPath} loop />
            )}
            {playlistPlaying && playlistSlot === 1 && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative">
                <div className="w-20 h-20 rounded-full border-4 border-teal-400/30 flex items-center justify-center mb-5">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2" />
                  </svg>
                </div>
                <p className="eyebrow text-slate-500 mb-2">Battery State of Charge</p>
                <p className={`text-8xl font-bold num mb-3 ${batteryTextColor}`}>{batteryCtx}%</p>
                <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all ${batteryColor}`} style={{ width: `${batteryCtx}%` }} />
                </div>
                <p className="text-slate-600 text-sm">Simulated SoC · Charger 03</p>
                <div className="absolute top-5 right-5 text-slate-700 text-xl font-bold">Video<span className="text-teal-800">EV</span></div>
              </div>
            )}
            {playlistPlaying && playlistSlot === 2 && (
              <div
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${venueAd.from}, ${venueAd.to})` }}
              >
                <p className="text-white/50 eyebrow mb-4">Contextual · {venueCtx.replace(/_/g, " ")}</p>
                <h2 className="text-4xl lg:text-7xl font-bold text-white mb-4 text-center px-8">{venueAd.brand}</h2>
                <p className="text-white/75 text-lg lg:text-2xl text-center px-8">{venueAd.tagline}</p>
                <div className="absolute bottom-5 right-5 bg-black/25 backdrop-blur rounded-full px-3 py-1 text-white/50 text-xs">${venueAd.cpm} CPM</div>
                <div className="absolute top-5 right-5 text-white/30 text-xl font-bold">Video<span className="text-white/50">EV</span></div>
              </div>
            )}
            {playlistPlaying && playlistSlot === 3 && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative">
                <img src="/videoev-icon-clear.svg" alt="VideoEV" className="w-20 h-20 mb-6 opacity-80 drop-shadow-2xl" />
                <h2 className="text-5xl lg:text-7xl font-bold text-white mb-3">Video<span className="text-teal-400">EV</span></h2>
                <p className="text-slate-400 text-xl text-center px-8">The EV Charging Ad Network</p>
                <div className="flex gap-6 mt-10 text-center">
                  <div><p className="text-teal-400 text-3xl font-bold num">4.2M</p><p className="text-slate-600 text-xs mt-1">Monthly Sessions</p></div>
                  <div><p className="text-teal-400 text-3xl font-bold num">$42</p><p className="text-slate-600 text-xs mt-1">Avg CPM</p></div>
                  <div><p className="text-teal-400 text-3xl font-bold num">45m</p><p className="text-slate-600 text-xs mt-1">Avg Dwell</p></div>
                </div>
              </div>
            )}

            {/* ── Normal charging mode ── */}
            {!playlistPlaying && adPhase === "warmup" && (
              <VideoAd key={`${carMake}-${locationCtx}-${batteryCtx}-${venueCtx}-${msrpCtx}-${dwellCtx}-${weatherCtx}-${timeCtx}-${trafficCtx}`} src={adTagPath} loop />
            )}
            {!playlistPlaying && adPhase === "display" && (
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
                <div className="absolute bottom-5 left-5 flex flex-col items-center gap-1.5">
                    <div className="bg-white/95 rounded-lg p-2">
                      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Top-left finder */}
                        <rect x="2" y="2" width="22" height="22" rx="2" fill="#111" /><rect x="6" y="6" width="14" height="14" rx="1" fill="white" /><rect x="9" y="9" width="8" height="8" rx="1" fill="#111" />
                        {/* Top-right finder */}
                        <rect x="48" y="2" width="22" height="22" rx="2" fill="#111" /><rect x="52" y="6" width="14" height="14" rx="1" fill="white" /><rect x="55" y="9" width="8" height="8" rx="1" fill="#111" />
                        {/* Bottom-left finder */}
                        <rect x="2" y="48" width="22" height="22" rx="2" fill="#111" /><rect x="6" y="52" width="14" height="14" rx="1" fill="white" /><rect x="9" y="55" width="8" height="8" rx="1" fill="#111" />
                        {/* Data cells */}
                        <rect x="28" y="2" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="2" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="2" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="8" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="8" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="14" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="14" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="20" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="20" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="20" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="2" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="8" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="20" y="28" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="48" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="60" y="28" width="4" height="4" rx="0.5" fill="#111" /><rect x="66" y="28" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="2" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="14" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="20" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="28" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="54" y="34" width="4" height="4" rx="0.5" fill="#111" /><rect x="66" y="34" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="2" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="8" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="14" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="28" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="48" y="40" width="4" height="4" rx="0.5" fill="#111" /><rect x="60" y="40" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="48" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="48" width="4" height="4" rx="0.5" fill="#111" /><rect x="48" y="48" width="4" height="4" rx="0.5" fill="#111" /><rect x="54" y="48" width="4" height="4" rx="0.5" fill="#111" /><rect x="66" y="48" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="54" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="54" width="4" height="4" rx="0.5" fill="#111" /><rect x="48" y="54" width="4" height="4" rx="0.5" fill="#111" /><rect x="60" y="54" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="60" width="4" height="4" rx="0.5" fill="#111" /><rect x="40" y="60" width="4" height="4" rx="0.5" fill="#111" /><rect x="54" y="60" width="4" height="4" rx="0.5" fill="#111" /><rect x="60" y="60" width="4" height="4" rx="0.5" fill="#111" /><rect x="66" y="60" width="4" height="4" rx="0.5" fill="#111" />
                        <rect x="28" y="66" width="4" height="4" rx="0.5" fill="#111" /><rect x="34" y="66" width="4" height="4" rx="0.5" fill="#111" /><rect x="48" y="66" width="4" height="4" rx="0.5" fill="#111" /><rect x="66" y="66" width="4" height="4" rx="0.5" fill="#111" />
                      </svg>
                    </div>
                    <span className="text-white/60 text-[9px] font-medium tracking-wide">Scan for offer</span>
                  </div>
              </div>
            )}
            {!playlistPlaying && isVideoPhase && (
              <VideoAd key={adPhase} src={currentVideoAd[0]} onEnded={onVideoEnded} />
            )}
          </div>
          {/* ── Session Playlist strip ── */}
          <div className="shrink-0 bg-slate-950 border-t border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${playlistPlaying ? "bg-yellow-400 animate-pulse" : "bg-slate-700"}`} />
                <span className="eyebrow text-slate-500">Charging Session Playlist</span>
                {playlistPlaying && (
                  <span className="text-yellow-400/70 font-mono text-[10px]">LIVE · Slot {playlistSlot + 1}/4</span>
                )}
              </div>
              <button
                onClick={() => {
                  const starting = !playlistPlaying;
                  setPlaylistPlaying(starting);
                  if (starting) {
                    setPlaylistSlot(0);
                    const item = playlistItemRef.current[0];
                    if (item) setTerminalLines(prev => [...prev, `[SESSION] Playlist started · Slot 1 → Priority: ${item.label} (${item.sublabel})`]);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  playlistPlaying
                    ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/25"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                {playlistPlaying ? (
                  <><svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> Pause</>
                ) : (
                  <><svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg> Play Session</>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              {sessionPlaylist.map((item) => {
                const isActive = playlistPlaying && playlistSlot === item.slot;
                const accentBorder = {
                  yellow: "border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.25)]",
                  teal:   "border-teal-400   shadow-[0_0_12px_rgba(45,212,191,0.2)]",
                  violet: "border-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.2)]",
                  slate:  "border-slate-400  shadow-[0_0_12px_rgba(148,163,184,0.15)]",
                }[item.accent];
                const accentText = {
                  yellow: "text-yellow-400", teal: "text-teal-400",
                  violet: "text-violet-400", slate: "text-slate-400",
                }[item.accent];
                const typeIcon = {
                  priority:   "▶",
                  utility:    "⚡",
                  contextual: "📍",
                  brand:      "◈",
                }[item.type] ?? "·";
                return (
                  <button
                    key={item.slot}
                    onClick={() => { setPlaylistSlot(item.slot); if (!playlistPlaying) setPlaylistPlaying(true); }}
                    className={`flex-1 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? `${accentBorder} bg-slate-900`
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold ${isActive ? accentText : "text-slate-600"}`}>
                        {typeIcon} {item.slot + 1}
                      </span>
                      {isActive && <span className={`w-1.5 h-1.5 rounded-full ${accentText} bg-current animate-pulse`} />}
                    </div>
                    <p className={`text-xs font-semibold truncate mb-0.5 ${isActive ? "text-white" : "text-slate-400"}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? accentText : "text-slate-600"}`}>
                      {item.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
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
          <span className="text-slate-700">·</span>
          <button
            onClick={() => { setBattery(vehicle.target); setStage("complete"); setCompletionStarted(true); }}
            className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Skip to end →
          </button>
        </div>
      </footer>
    </div>
  );
}
