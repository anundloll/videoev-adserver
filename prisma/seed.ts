/**
 * VideoEV Neon Seed Script
 * Populates: 25 Accounts, 37 Campaigns, 35 Creatives, 28 Stations, synthetic TrackingEvents
 *
 * Run: npx tsx prisma/seed.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Accounts ─────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { externalId: "acc-001", name: "Dentsu Creative",        initials: "DE",  industry: "Holding Company",      type: "Agency", clients: 14, accountId: "AGY-00101" },
  { externalId: "acc-002", name: "Publicis Media",          initials: "PB",  industry: "Holding Company",      type: "Agency", clients: 9,  accountId: "AGY-00204" },
  { externalId: "acc-003", name: "PMG",                     initials: "PMG", industry: "Independent Agency",   type: "Agency", clients: 6,  accountId: "AGY-00318" },
  { externalId: "acc-004", name: "Known",                   initials: "KN",  industry: "Independent Agency",   type: "Agency", clients: 4,  accountId: "AGY-00421" },
  { externalId: "acc-005", name: "Rolex SA",                initials: "R",   industry: "Luxury Watches",       type: "Brand",              accountId: "ADV-00492" },
  { externalId: "acc-006", name: "Bentley Motors",           initials: "BM",  industry: "Automotive",           type: "Brand",              accountId: "ADV-00618" },
  { externalId: "acc-007", name: "Porsche AG",               initials: "PA",  industry: "Automotive",           type: "Brand",              accountId: "ADV-00731" },
  { externalId: "acc-008", name: "JPMorgan Private Bank",    initials: "JP",  industry: "Private Banking",      type: "Brand",              accountId: "ADV-00844" },
  { externalId: "acc-009", name: "American Express",         initials: "AX",  industry: "Financial Services",   type: "Brand",              accountId: "ADV-00955" },
  { externalId: "acc-010", name: "Nike Inc.",                initials: "NK",  industry: "Athletic Apparel",     type: "Brand",              accountId: "ADV-01062" },
  { externalId: "acc-011", name: "Apple Inc.",               initials: "AP",  industry: "Consumer Technology",  type: "Brand",              accountId: "ADV-01175" },
  { externalId: "acc-012", name: "Kia America",              initials: "KA",  industry: "Automotive",           type: "Brand",              accountId: "ADV-01288" },
  { externalId: "acc-013", name: "Rocket Companies",         initials: "RC",  industry: "Real Estate/Finance",  type: "Brand",              accountId: "ADV-01391" },
  { externalId: "acc-014", name: "Target Corporation",       initials: "TG",  industry: "Retail",               type: "Brand",              accountId: "ADV-01404" },
  { externalId: "acc-015", name: "L'Oréal / Maybelline",     initials: "LM",  industry: "Beauty & Cosmetics",   type: "Brand",              accountId: "ADV-01517" },
  { externalId: "acc-016", name: "Planet Fitness",           initials: "PF",  industry: "Fitness & Wellness",   type: "Brand",              accountId: "ADV-01620" },
  { externalId: "acc-017", name: "Amazon.com Inc.",           initials: "AZ",  industry: "E-Commerce / Tech",    type: "Brand",              accountId: "ADV-01733" },
  { externalId: "acc-018", name: "T-Mobile US",               initials: "TM",  industry: "Telecommunications",   type: "Brand",              accountId: "ADV-01846" },
  { externalId: "acc-019", name: "Capital One Financial",     initials: "CO",  industry: "Financial Services",   type: "Brand",              accountId: "ADV-01959" },
  { externalId: "acc-020", name: "Panera Bread",              initials: "PB",  industry: "Quick Service Rest.",  type: "Brand",              accountId: "ADV-02062" },
  { externalId: "acc-021", name: "Progressive Insurance",     initials: "PR",  industry: "Insurance",            type: "Brand",              accountId: "ADV-02175" },
  { externalId: "acc-022", name: "Liberty Mutual Insurance",  initials: "LI",  industry: "Insurance",            type: "Brand",              accountId: "ADV-02288" },
  { externalId: "acc-023", name: "Walmart Inc.",              initials: "WM",  industry: "Retail",               type: "Brand",              accountId: "ADV-02391" },
  { externalId: "acc-024", name: "Applebee's (Dine Brands)",  initials: "AB",  industry: "Casual Dining",        type: "Brand",              accountId: "ADV-02404" },
  { externalId: "acc-025", name: "Darden Restaurants",        initials: "DR",  industry: "Casual Dining",        type: "Brand",              accountId: "ADV-02517" },
] as const;

// Map advertiser name → account externalId for campaign FK lookup
const ADVERTISER_ACCOUNT_MAP: Record<string, string> = {
  "Rolex SA":                    "acc-005",
  "American Express":             "acc-009",
  "NetJets Inc.":                 "acc-002",  // Publicis client
  "Four Seasons Hotels":          "acc-001",  // Dentsu client
  "Porsche AG":                   "acc-007",
  "Hermès International":         "acc-002",
  "Bang & Olufsen":               "acc-003",
  "Bentley Motors":               "acc-006",
  "Patek Philippe SA":            "acc-001",
  "Louis Vuitton":                "acc-002",
  "Rolls-Royce Motor Cars":       "acc-001",
  "Ritz-Carlton Hotel Co.":       "acc-001",
  "McLaren Automotive":           "acc-003",
  "Chanel S.A.":                  "acc-002",
  "Automobili Lamborghini":       "acc-002",
  "Sotheby's":                    "acc-001",
  "TAG Heuer SA":                 "acc-003",
  "Aman Group S.à r.l.":          "acc-001",
  "Goldman Sachs":                "acc-008",
  "Aston Martin Lagonda":         "acc-003",
  "Nike Inc.":                    "acc-010",
  "Apple Inc.":                   "acc-011",
  "Kia America":                  "acc-012",
  "Rocket Companies":             "acc-013",
  "Target Corporation":           "acc-014",
  "Maybelline New York":          "acc-015",
  "Planet Fitness":               "acc-016",
  "Amazon.com Inc.":              "acc-017",
  "T-Mobile US":                  "acc-018",
  "Capital One Financial":        "acc-019",
  "Panera Bread":                 "acc-020",
  "Progressive Insurance":        "acc-021",
  "Liberty Mutual Insurance":     "acc-022",
  "Walmart Inc.":                 "acc-023",
  "Applebee's (Dine Brands)":     "acc-024",
  "Darden Restaurants":           "acc-025",
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

const S3 = "https://videoev.s3.us-east-1.amazonaws.com";

const CAMPAIGNS = [
  {
    externalId: "cmp-001", name: "Rolex Perpetual Motion — Q1",             advertiser: "Rolex SA",
    status: "live",    type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-15", flightEnd: "2026-03-31",
    budget: 240000, spend: 118430, plays: 62480, completionRate: 96.2, pacing: 96, pacingType: "even", frequencyCap: 3,
    baseCpm: 28, sector: "Luxury Watches",
    networks: ["revel","evgo","electrify"], cities: ["New York","Los Angeles","Miami"],
    msrpTier: "$120K+", vehicleModels: ["Tesla Model S","BMW i7","Mercedes EQS","Lucid Air"],
    audienceSegments: ["EV Luxury Owners","Ultra-High-Net-Worth ($10M+ NW)","Automotive Enthusiasts"],
    conversionType: "QR_Discount", ctaCopy: "Discover Rolex",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["ultra_luxury","high_net_worth","affluent","luxury_buyer"] },
    videoUrl: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-002", name: "Amex Platinum — Prestige Drive",           advertiser: "American Express",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-01", flightEnd: "2026-04-30",
    budget: 180000, spend: 44210, plays: 21940, completionRate: 94.7, pacing: 101, pacingType: "even", frequencyCap: 2,
    baseCpm: 22, sector: "Financial Services",
    networks: ["chargepoint","revel","bp"], cities: ["New York","San Francisco","Chicago"],
    msrpTier: "$80K–$120K", vehicleModels: ["Tesla Model 3","BMW iX","Rivian R1T","Audi e-tron GT"],
    audienceSegments: ["Premium Card Holders","Frequent Business Travellers","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Apply for Platinum",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.1, weekend: 1.15 }, targetAffinities: ["high_net_worth","business_class","traveler","corporate"] },
    videoUrl: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-003", name: "NetJets — Private Above All",               advertiser: "NetJets Inc.",
    status: "live",    type: "direct",        objective: "awareness",       placement: "car-tablet",
    flightStart: "2026-02-10", flightEnd: "2026-05-10",
    budget: 320000, spend: 61800, plays: 19350, completionRate: 97.1, pacing: 88, pacingType: "front-loaded", frequencyCap: 2,
    baseCpm: 30, sector: "Private Aviation",
    networks: ["revel","evgo"], cities: ["New York","Miami","Los Angeles","Las Vegas"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Mercedes EQS","Lucid Air"],
    audienceSegments: ["Private Aviation Users","Ultra-High-Net-Worth ($10M+ NW)","Real Estate Investors"],
    conversionType: "Lead_Gen", ctaCopy: "Request a Demo Flight",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.3 }, targetAffinities: ["ultra_luxury","high_net_worth","traveler","business_class","luxury_buyer"] },
    videoUrl: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`,
  },
  {
    externalId: "cmp-004", name: "Four Seasons — Where Else",                 advertiser: "Four Seasons Hotels",
    status: "pending", type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2026-03-01", flightEnd: "2026-06-30",
    budget: 150000, spend: 0, plays: 0, completionRate: 0, pacing: 0, pacingType: "even", frequencyCap: 3,
    baseCpm: 26, sector: "Luxury Hospitality",
    networks: ["revel","chargepoint","electrify"], cities: ["New York","Los Angeles","Miami","Seattle"],
    msrpTier: "$80K–$120K", vehicleModels: ["Tesla Model S","BMW i7","Porsche Taycan"],
    audienceSegments: ["Fine Dining & Hospitality","Frequent Business Travellers","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Explore Four Seasons",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.0, weekend: 1.25 }, targetAffinities: ["luxury_buyer","affluent","traveler"] },
    videoUrl: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`,
  },
  {
    externalId: "cmp-005", name: "Porsche Taycan Conquest",                   advertiser: "Porsche AG",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-01-20", flightEnd: "2026-02-28",
    budget: 90000, spend: 82100, plays: 48220, completionRate: 93.8, pacing: 107, pacingType: "back-loaded", frequencyCap: 4,
    baseCpm: 18, sector: "Automotive",
    networks: ["chargepoint","evgo","bp"], cities: ["Los Angeles","San Francisco","New York"],
    msrpTier: "$80K–$120K", vehicleModels: ["Tesla Model S","BMW i7","Audi e-tron GT","Mercedes EQS"],
    audienceSegments: ["Automotive Enthusiasts","EV Luxury Owners","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "App_Install", ctaCopy: "Configure Your Taycan",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.05, weekend: 1.2 }, targetAffinities: ["affluent","high_msrp","porsche"] },
    videoUrl: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-006", name: "Hermès Maison — Silently Rare",             advertiser: "Hermès International",
    status: "paused",  type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2025-11-01", flightEnd: "2026-01-15",
    budget: 200000, spend: 198400, plays: 74100, completionRate: 95.4, pacing: 99, pacingType: "even", frequencyCap: 2,
    baseCpm: 29, sector: "Luxury Fashion",
    networks: ["revel","evgo"], cities: ["New York","Miami"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Mercedes EQS","Lucid Air"],
    audienceSegments: ["Luxury Fashion Enthusiasts","Ultra-High-Net-Worth ($10M+ NW)","Art & Culture Collectors"],
    conversionType: "QR_Discount", ctaCopy: "Visit Hermès",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.15 }, targetAffinities: ["ultra_luxury","luxury_buyer","affluent"] },
    videoUrl: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-007", name: "B&O Beosound Theatre",                      advertiser: "Bang & Olufsen",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "car-tablet",
    flightStart: "2026-02-15", flightEnd: "2026-04-15",
    budget: 60000, spend: 8920, plays: 5440, completionRate: 92.6, pacing: 94, pacingType: "even", frequencyCap: 3,
    baseCpm: 17, sector: "Consumer Electronics",
    networks: ["chargepoint","electrify","applegreen"], cities: ["New York","Chicago","Seattle"],
    msrpTier: "$50K–$80K", vehicleModels: ["BMW iX","Audi Q8 e-tron","Tesla Model X"],
    audienceSegments: ["Art & Culture Collectors","Tech Executives","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Hear the Difference",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["affluent","corporate","urban"] },
    videoUrl: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-008", name: "Bentley Bentayga — Quiet Dominance",        advertiser: "Bentley Motors",
    status: "live",    type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-28", flightEnd: "2026-04-28",
    budget: 280000, spend: 96400, plays: 31820, completionRate: 97.4, pacing: 103, pacingType: "even", frequencyCap: 2,
    baseCpm: 30, sector: "Automotive",
    networks: ["revel","evgo","electrify"], cities: ["New York","Los Angeles","Miami","Las Vegas"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Lucid Air","Mercedes EQS","BMW i7"],
    audienceSegments: ["Ultra-High-Net-Worth ($10M+ NW)","Automotive Enthusiasts","Real Estate Investors"],
    conversionType: "Lead_Gen", ctaCopy: "Request a Test Drive",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["ultra_luxury","high_net_worth","high_msrp"] },
    videoUrl: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-009", name: "Patek Philippe — The Grand Complication",   advertiser: "Patek Philippe SA",
    status: "live",    type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2026-02-01", flightEnd: "2026-03-15",
    budget: 175000, spend: 72100, plays: 24380, completionRate: 96.8, pacing: 98, pacingType: "even", frequencyCap: 2,
    baseCpm: 30, sector: "Luxury Watches",
    networks: ["revel","evgo"], cities: ["New York","Geneva","Miami"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Lucid Air"],
    audienceSegments: ["Ultra-High-Net-Worth ($10M+ NW)","Art & Culture Collectors","Private Aviation Users"],
    conversionType: "QR_Discount", ctaCopy: "Discover the Collection",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.25 }, targetAffinities: ["ultra_luxury","high_net_worth","luxury_buyer"] },
    videoUrl: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-010", name: "Louis Vuitton — Savoir-Faire",              advertiser: "Louis Vuitton",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-08", flightEnd: "2026-05-31",
    budget: 220000, spend: 38650, plays: 18840, completionRate: 93.2, pacing: 92, pacingType: "even", frequencyCap: 3,
    baseCpm: 21, sector: "Luxury Fashion",
    networks: ["chargepoint","evgo","revel"], cities: ["New York","Los Angeles","Chicago","Miami"],
    msrpTier: "$80K–$120K", vehicleModels: ["Tesla Model S","BMW iX","Audi Q8 e-tron","Mercedes EQS"],
    audienceSegments: ["Luxury Fashion Enthusiasts","Art & Culture Collectors","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "QR_Discount", ctaCopy: "Explore LV",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["luxury_buyer","affluent","urban"] },
    videoUrl: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-011", name: "Rolls-Royce Ghost — Effortless",            advertiser: "Rolls-Royce Motor Cars",
    status: "live",    type: "direct",        objective: "awareness",       placement: "car-tablet",
    flightStart: "2026-01-10", flightEnd: "2026-06-10",
    budget: 400000, spend: 142800, plays: 47600, completionRate: 97.8, pacing: 91, pacingType: "front-loaded", frequencyCap: 2,
    baseCpm: 30, sector: "Automotive",
    networks: ["revel","evgo"], cities: ["New York","Los Angeles","Miami","Las Vegas","San Francisco"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Lucid Air","Mercedes EQS"],
    audienceSegments: ["Ultra-High-Net-Worth ($10M+ NW)","Private Aviation Users","Real Estate Investors"],
    conversionType: "Lead_Gen", ctaCopy: "Commission Your Ghost",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.3 }, targetAffinities: ["ultra_luxury","high_net_worth","luxury_buyer"] },
    videoUrl: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-012", name: "Ritz-Carlton Reserve — Beyond All Things",  advertiser: "Ritz-Carlton Hotel Co.",
    status: "pending", type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2026-03-15", flightEnd: "2026-07-15",
    budget: 130000, spend: 0, plays: 0, completionRate: 0, pacing: 0, pacingType: "even", frequencyCap: 3,
    baseCpm: 25, sector: "Luxury Hospitality",
    networks: ["revel","evgo","electrify"], cities: ["Miami","Los Angeles","New York"],
    msrpTier: "$120K+", vehicleModels: ["Tesla Model S","BMW i7","Lucid Air"],
    audienceSegments: ["Fine Dining & Hospitality","Ultra-High-Net-Worth ($10M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Reserve Your Stay",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["ultra_luxury","high_net_worth","traveler"] },
    videoUrl: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`,
  },
  {
    externalId: "cmp-013", name: "McLaren GT — Track to Street",              advertiser: "McLaren Automotive",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-12", flightEnd: "2026-04-30",
    budget: 95000, spend: 21400, plays: 11880, completionRate: 94.1, pacing: 89, pacingType: "even", frequencyCap: 3,
    baseCpm: 19, sector: "Automotive",
    networks: ["chargepoint","evgo","electrify"], cities: ["Los Angeles","Miami","New York"],
    msrpTier: "$120K+", vehicleModels: ["Porsche Taycan","BMW iX","Tesla Model S"],
    audienceSegments: ["Automotive Enthusiasts","EV Luxury Owners"],
    conversionType: "App_Install", ctaCopy: "Book a Track Day",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.05, weekend: 1.15 }, targetAffinities: ["affluent","high_msrp","high_net_worth"] },
    videoUrl: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-014", name: "Chanel No.5 — Time Is Running Out",         advertiser: "Chanel S.A.",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "in-app",
    flightStart: "2026-01-25", flightEnd: "2026-03-31",
    budget: 160000, spend: 104200, plays: 52100, completionRate: 92.4, pacing: 97, pacingType: "even", frequencyCap: 4,
    baseCpm: 20, sector: "Luxury Fashion",
    networks: ["chargepoint","bp","applegreen"], cities: ["New York","Los Angeles","Chicago","Seattle"],
    msrpTier: "$80K–$120K", vehicleModels: ["Tesla Model 3","BMW iX","Audi Q8 e-tron"],
    audienceSegments: ["Luxury Fashion Enthusiasts","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "QR_Discount", ctaCopy: "Discover Chanel No.5",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["luxury_buyer","affluent","urban"] },
    videoUrl: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-015", name: "Lamborghini Urus — 650 Reasons",            advertiser: "Automobili Lamborghini",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "station-screen",
    flightStart: "2026-02-18", flightEnd: "2026-04-18",
    budget: 110000, spend: 17640, plays: 9260, completionRate: 95.1, pacing: 86, pacingType: "back-loaded", frequencyCap: 3,
    baseCpm: 19, sector: "Automotive",
    networks: ["evgo","revel","chargepoint"], cities: ["Miami","Los Angeles","Las Vegas"],
    msrpTier: "$120K+", vehicleModels: ["Porsche Taycan","BMW i7","Mercedes EQS"],
    audienceSegments: ["Automotive Enthusiasts","EV Luxury Owners","High-Net-Worth Individuals ($1M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Configure Your Urus",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["affluent","high_msrp","high_net_worth"] },
    videoUrl: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-016", name: "Sotheby's — Contemporary Evening Sale",     advertiser: "Sotheby's",
    status: "paused",  type: "direct",        objective: "awareness",       placement: "station-screen",
    flightStart: "2025-12-01", flightEnd: "2026-01-31",
    budget: 80000, spend: 79200, plays: 28400, completionRate: 96.0, pacing: 99, pacingType: "even", frequencyCap: 2,
    baseCpm: 28, sector: "Art & Culture",
    networks: ["revel","evgo"], cities: ["New York","Los Angeles"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Lucid Air"],
    audienceSegments: ["Art & Culture Collectors","Ultra-High-Net-Worth ($10M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Register to Bid",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.15 }, targetAffinities: ["ultra_luxury","high_net_worth","luxury_buyer"] },
    videoUrl: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-017", name: "TAG Heuer Connected — Code Breaker",        advertiser: "TAG Heuer SA",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "car-tablet",
    flightStart: "2026-02-20", flightEnd: "2026-05-20",
    budget: 70000, spend: 6820, plays: 4010, completionRate: 91.8, pacing: 78, pacingType: "even", frequencyCap: 3,
    baseCpm: 17, sector: "Luxury Watches",
    networks: ["chargepoint","electrify","bp"], cities: ["New York","San Francisco","Chicago"],
    msrpTier: "$50K–$80K", vehicleModels: ["BMW iX","Audi e-tron GT","Tesla Model Y"],
    audienceSegments: ["Tech Executives","Automotive Enthusiasts"],
    conversionType: "App_Install", ctaCopy: "Connect Your Watch",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["affluent","corporate","morning"] },
    videoUrl: `${S3}/Oakley+TV+Spot+Athletic+Intelligence+Is+Here+Featuring+Kylian+Mbapp+Mark+Cavendish+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-018", name: "Aman Resorts — Silence Reimagined",         advertiser: "Aman Group S.à r.l.",
    status: "pending", type: "direct",        objective: "awareness",       placement: "car-tablet",
    flightStart: "2026-04-01", flightEnd: "2026-08-31",
    budget: 210000, spend: 0, plays: 0, completionRate: 0, pacing: 0, pacingType: "even", frequencyCap: 2,
    baseCpm: 27, sector: "Luxury Hospitality",
    networks: ["revel","evgo","electrify"], cities: ["New York","Los Angeles","Miami","Las Vegas"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Lucid Air","Mercedes EQS"],
    audienceSegments: ["Private Aviation Users","Ultra-High-Net-Worth ($10M+ NW)","Fine Dining & Hospitality"],
    conversionType: "Lead_Gen", ctaCopy: "Request Reservations",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.3 }, targetAffinities: ["ultra_luxury","high_net_worth","traveler"] },
    videoUrl: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`,
  },
  {
    externalId: "cmp-019", name: "Goldman Sachs PWM — Generational Wealth",   advertiser: "Goldman Sachs",
    status: "paused",  type: "direct",        objective: "consideration",   placement: "station-screen",
    flightStart: "2025-10-01", flightEnd: "2025-12-31",
    budget: 300000, spend: 296100, plays: 98700, completionRate: 95.8, pacing: 99, pacingType: "even", frequencyCap: 2,
    baseCpm: 30, sector: "Private Banking",
    networks: ["revel","evgo","electrify"], cities: ["New York","San Francisco","Chicago","Los Angeles"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","BMW i7","Lucid Air","Mercedes EQS"],
    audienceSegments: ["Ultra-High-Net-Worth ($10M+ NW)","Real Estate Investors","Private Aviation Users"],
    conversionType: "Lead_Gen", ctaCopy: "Speak to a Private Banker",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["ultra_luxury","high_net_worth","corporate","b2b"] },
    videoUrl: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-020", name: "Aston Martin DB12 — The Soul of an Aston",  advertiser: "Aston Martin Lagonda",
    status: "live",    type: "direct",        objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-22", flightEnd: "2026-05-22",
    budget: 145000, spend: 12100, plays: 4030, completionRate: 96.4, pacing: 84, pacingType: "even", frequencyCap: 2,
    baseCpm: 30, sector: "Automotive",
    networks: ["revel","evgo"], cities: ["London","New York","Miami"],
    msrpTier: "$120K+", vehicleModels: ["Rolls-Royce Spectre","Bentley EXP 100","Ferrari Purosangue","Lucid Air"],
    audienceSegments: ["Automotive Enthusiasts","Ultra-High-Net-Worth ($10M+ NW)"],
    conversionType: "Lead_Gen", ctaCopy: "Book a Viewing",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["ultra_luxury","high_net_worth","high_msrp"] },
    videoUrl: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-021", name: "Nike — Why Do It",                          advertiser: "Nike Inc.",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-20", flightEnd: "2026-03-31",
    budget: 185000, spend: 44200, plays: 31570, completionRate: 94.2, pacing: 98, pacingType: "even", frequencyCap: 4,
    baseCpm: 14, sector: "Athletic Apparel",
    networks: ["chargepoint","evgo","electrify","blink"], cities: ["New York","Los Angeles","Chicago","Houston","Atlanta"],
    msrpTier: "$50K–$80K", vehicleModels: ["Tesla Model Y","Ford Mustang Mach-E","Chevrolet Equinox EV","Rivian R1T"],
    audienceSegments: ["Sports & Fitness Enthusiasts","Mainstream EV Drivers","Automotive Enthusiasts"],
    conversionType: "App_Install", ctaCopy: "Shop Nike",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["suburban","homeowner","morning"] },
    videoUrl: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-022", name: "Apple iPhone 17 Pro — Smart Group Selfies", advertiser: "Apple Inc.",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-01", flightEnd: "2026-04-15",
    budget: 320000, spend: 88400, plays: 49110, completionRate: 93.6, pacing: 101, pacingType: "even", frequencyCap: 3,
    baseCpm: 18, sector: "Consumer Technology",
    networks: ["chargepoint","electrify","evgo","blink"], cities: ["New York","Los Angeles","San Francisco","Chicago","Seattle"],
    msrpTier: "$50K–$80K", vehicleModels: ["Tesla Model 3","BMW iX","Rivian R1S","Polestar 2"],
    audienceSegments: ["Tech Early Adopters","High-Net-Worth Individuals ($1M+ NW)","Frequent Business Travellers"],
    conversionType: "App_Install", ctaCopy: "Pre-order iPhone 17 Pro",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.05, weekend: 1.15 }, targetAffinities: ["urban","corporate","morning","tech_buyer"] },
    videoUrl: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-023", name: "2027 Kia Telluride X-Pro — Horse Herder",   advertiser: "Kia America",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "station-screen",
    flightStart: "2026-02-10", flightEnd: "2026-04-30",
    budget: 140000, spend: 28800, plays: 19200, completionRate: 93.1, pacing: 91, pacingType: "even", frequencyCap: 3,
    baseCpm: 15, sector: "Automotive",
    networks: ["chargepoint","evgo","electrify","blink"], cities: ["Los Angeles","Dallas","Atlanta","Phoenix","Denver"],
    msrpTier: "$50K–$80K", vehicleModels: ["Hyundai IONIQ 6","Kia EV6","Chevrolet Equinox EV","Ford F-150 Lightning"],
    audienceSegments: ["Automotive Enthusiasts","Mainstream EV Drivers","Sports & Fitness Enthusiasts"],
    conversionType: "Lead_Gen", ctaCopy: "Build Your Telluride",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.15 }, targetAffinities: ["suburban","homeowner","family"] },
    videoUrl: `${S3}/2027+Kia+Telluride+X-Pro+TV+Spot+Horse+Herder+T1+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-024", name: "Rocket + Redfin — Your Journey Home",       advertiser: "Rocket Companies",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-15", flightEnd: "2026-05-15",
    budget: 95000, spend: 18200, plays: 14000, completionRate: 91.8, pacing: 88, pacingType: "even", frequencyCap: 4,
    baseCpm: 13, sector: "Real Estate/Finance",
    networks: ["chargepoint","blink","bp"], cities: ["Chicago","Atlanta","Dallas","Phoenix","Denver","Charlotte"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Ford Mustang Mach-E","Volkswagen ID.4"],
    audienceSegments: ["Home Buyers & Movers","Real Estate Investors","Mainstream EV Drivers"],
    conversionType: "Lead_Gen", ctaCopy: "Start Your Mortgage",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["suburban","homeowner","family"] },
    videoUrl: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4`,
  },
  {
    externalId: "cmp-025", name: "Target — Wellness Perfectly Picked",        advertiser: "Target Corporation",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-15", flightEnd: "2026-03-31",
    budget: 220000, spend: 62100, plays: 56450, completionRate: 92.8, pacing: 97, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Retail",
    networks: ["chargepoint","blink","electrify","bp"], cities: ["Chicago","Minneapolis","Dallas","Atlanta","Denver","Phoenix"],
    msrpTier: "$30K–$50K", vehicleModels: ["Chevrolet Equinox EV","Volkswagen ID.4","Ford Mustang Mach-E","Hyundai IONIQ 5"],
    audienceSegments: ["Health & Wellness Shoppers","Mainstream EV Drivers","Sports & Fitness Enthusiasts"],
    conversionType: "App_Install", ctaCopy: "Shop Target",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.0, weekend: 1.25 }, targetAffinities: ["suburban","homeowner","family","shopper"] },
    videoUrl: `${S3}/Target+TV+Spot+Wellness+Perfectly+Picked+for+You+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-026", name: "Maybelline — Endless Possibilities",        advertiser: "Maybelline New York",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "in-app",
    flightStart: "2026-02-05", flightEnd: "2026-04-05",
    budget: 110000, spend: 24100, plays: 18540, completionRate: 91.4, pacing: 94, pacingType: "even", frequencyCap: 4,
    baseCpm: 13, sector: "Beauty & Cosmetics",
    networks: ["chargepoint","electrify","blink","bp"], cities: ["New York","Los Angeles","Chicago","Miami","Houston"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model 3","Chevrolet Equinox EV","Hyundai IONIQ 5","Volkswagen ID.4"],
    audienceSegments: ["Beauty & Personal Care","Health & Wellness Shoppers","Luxury Fashion Enthusiasts"],
    conversionType: "QR_Discount", ctaCopy: "Try Serum Lipstick",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["urban","shopper","family"] },
    videoUrl: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-027", name: "Planet Fitness — Finish Strong",            advertiser: "Planet Fitness",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-28", flightEnd: "2026-03-31",
    budget: 75000, spend: 12800, plays: 11636, completionRate: 90.6, pacing: 93, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Fitness & Wellness",
    networks: ["blink","chargepoint","bp","electrify"], cities: ["Chicago","Atlanta","Phoenix","Dallas","Denver","Charlotte"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Hyundai IONIQ 5","Volkswagen ID.4"],
    audienceSegments: ["Sports & Fitness Enthusiasts","Health & Wellness Shoppers","Mainstream EV Drivers"],
    conversionType: "Lead_Gen", ctaCopy: "Join for $10/month",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.15 }, targetAffinities: ["suburban","morning","homeowner"] },
    videoUrl: `${S3}/Planet+Fitness+TV+Spot+Finish+Strong+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-028", name: "Amazon — Everyday Essentials",              advertiser: "Amazon.com Inc.",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-20", flightEnd: "2026-04-20",
    budget: 180000, spend: 32400, plays: 24923, completionRate: 91.2, pacing: 87, pacingType: "even", frequencyCap: 5,
    baseCpm: 13, sector: "E-Commerce",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["New York","Los Angeles","Chicago","Dallas","Atlanta","Seattle"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Ford Mustang Mach-E","Hyundai IONIQ 5"],
    audienceSegments: ["Online Shoppers","Value-Conscious Shoppers","Mainstream EV Drivers"],
    conversionType: "App_Install", ctaCopy: "Shop Amazon",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["suburban","shopper","family"] },
    videoUrl: `${S3}/Amazon+TV+Spot+Essentials+Waterproof+Mascara+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-029", name: "Amazon Alexa — Super Bowl 2026",            advertiser: "Amazon.com Inc.",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "in-app",
    flightStart: "2026-02-09", flightEnd: "2026-04-09",
    budget: 210000, spend: 44800, plays: 26353, completionRate: 92.4, pacing: 88, pacingType: "even", frequencyCap: 3,
    baseCpm: 17, sector: "E-Commerce",
    networks: ["chargepoint","electrify","blink","evgo"], cities: ["New York","Los Angeles","Chicago","San Francisco","Miami"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model 3","Tesla Model Y","Hyundai IONIQ 5","Chevrolet Equinox EV"],
    audienceSegments: ["Online Shoppers","Tech Early Adopters","Mainstream EV Drivers"],
    conversionType: "App_Install", ctaCopy: "Try Alexa Free",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.0, weekend: 1.15 }, targetAffinities: ["urban","morning","shopper"] },
    videoUrl: `${S3}/Amazon+Alexa+Super+Bowl+2026+TV+Spot+Chris+Hemsworth+Thinks+Alexa+Is+Scary+Good+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-030", name: "T-Mobile — Home Internet",                  advertiser: "T-Mobile US",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "station-screen",
    flightStart: "2026-01-25", flightEnd: "2026-04-10",
    budget: 155000, spend: 22800, plays: 19000, completionRate: 90.8, pacing: 86, pacingType: "even", frequencyCap: 5,
    baseCpm: 12, sector: "Telecommunications",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Dallas","Houston","Phoenix","Atlanta","Denver"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Volkswagen ID.4","Ford Mustang Mach-E","Chevrolet Equinox EV"],
    audienceSegments: ["Telecom Switchers","Mainstream EV Drivers","Value-Conscious Shoppers"],
    conversionType: "Lead_Gen", ctaCopy: "Switch & Save",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["suburban","homeowner","commuter"] },
    videoUrl: `${S3}/T-Mobile+Home+Internet+TV+Spot+Treadmill+30+per+Month+Featuring+Zach+Braff+Donald+Faison+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-031", name: "Capital One Venture X — Globe Hopping",     advertiser: "Capital One Financial",
    status: "live",    type: "programmatic",  objective: "consideration",   placement: "in-app",
    flightStart: "2026-02-05", flightEnd: "2026-05-05",
    budget: 130000, spend: 24100, plays: 16067, completionRate: 91.6, pacing: 91, pacingType: "even", frequencyCap: 4,
    baseCpm: 15, sector: "Financial Services",
    networks: ["chargepoint","evgo","electrify","revel"], cities: ["New York","Los Angeles","Chicago","Miami","San Francisco"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model 3","Tesla Model Y","BMW iX","Rivian R1S"],
    audienceSegments: ["Travel Rewards Cardholders","Frequent Business Travellers","Mainstream EV Drivers"],
    conversionType: "Lead_Gen", ctaCopy: "Apply for Venture X",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.05, weekend: 1.1 }, targetAffinities: ["traveler","business_class","urban","corporate"] },
    videoUrl: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-032", name: "Panera Bread — Mix and Match",              advertiser: "Panera Bread",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-02-10", flightEnd: "2026-04-10",
    budget: 80000, spend: 11200, plays: 10182, completionRate: 90.2, pacing: 89, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Quick Service Restaurant",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Atlanta","Dallas","Phoenix","Charlotte","Denver"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Volkswagen ID.4","Ford Mustang Mach-E"],
    audienceSegments: ["Quick Service Restaurant Visitors","Value-Conscious Shoppers","Mainstream EV Drivers"],
    conversionType: "QR_Discount", ctaCopy: "Get $5 Off",
    targetingRules: { bidMultipliers: { rain: 1.05, lowBattery: 1.1, weekend: 1.1 }, targetAffinities: ["suburban","commuter","morning"] },
    videoUrl: `${S3}/Panera+Bread+TV+Spot+Mix+and+Match+499+Each+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-033", name: "Progressive — Sleepover",                   advertiser: "Progressive Insurance",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-22", flightEnd: "2026-04-22",
    budget: 90000, spend: 13800, plays: 12545, completionRate: 90.4, pacing: 88, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Insurance",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Dallas","Houston","Atlanta","Phoenix","Charlotte"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Hyundai IONIQ 5","Volkswagen ID.4"],
    audienceSegments: ["Insurance Consideration","Mainstream EV Drivers","Value-Conscious Shoppers"],
    conversionType: "Lead_Gen", ctaCopy: "Get a Free Quote",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.1 }, targetAffinities: ["suburban","homeowner","commuter"] },
    videoUrl: `${S3}/Progressive+TV+Spot+Sleepover+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-034", name: "Liberty Mutual — Truth Tellers",            advertiser: "Liberty Mutual Insurance",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-02-08", flightEnd: "2026-04-08",
    budget: 85000, spend: 11200, plays: 10182, completionRate: 90.1, pacing: 87, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Insurance",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Atlanta","Phoenix","Dallas","Denver","Charlotte"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Hyundai IONIQ 5","Chevrolet Equinox EV","Volkswagen ID.4"],
    audienceSegments: ["Insurance Consideration","Mainstream EV Drivers","Value-Conscious Shoppers"],
    conversionType: "Lead_Gen", ctaCopy: "Only Pay for What You Need",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.05 }, targetAffinities: ["suburban","homeowner","commuter"] },
    videoUrl: `${S3}/Liberty+Mutual+TV+Spot+Truth+Tellers+Dating+App+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-035", name: "Walmart — They Don't Know You",              advertiser: "Walmart Inc.",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-01-15", flightEnd: "2026-04-15",
    budget: 200000, spend: 29700, plays: 27000, completionRate: 91.8, pacing: 94, pacingType: "even", frequencyCap: 5,
    baseCpm: 11, sector: "Retail",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Dallas","Houston","Atlanta","Phoenix","Charlotte","Denver"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Ford Mustang Mach-E","Hyundai IONIQ 5"],
    audienceSegments: ["Value-Conscious Shoppers","Online Shoppers","Mainstream EV Drivers"],
    conversionType: "App_Install", ctaCopy: "Shop Walmart+",
    targetingRules: { bidMultipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.2 }, targetAffinities: ["suburban","shopper","family","rural"] },
    videoUrl: `${S3}/Walmart+TV+Spot+They+Dont+Know+the+First+Thing+About+You+Featuring+Walton+Goggins+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-036", name: "Applebee's — Return of the Big Easy",       advertiser: "Applebee's (Dine Brands)",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-02-12", flightEnd: "2026-04-12",
    budget: 70000, spend: 8400, plays: 8400, completionRate: 89.8, pacing: 85, pacingType: "even", frequencyCap: 5,
    baseCpm: 10, sector: "Casual Dining",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Atlanta","Dallas","Phoenix","Charlotte","Denver"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Chevrolet Equinox EV","Volkswagen ID.4","Hyundai IONIQ 5"],
    audienceSegments: ["Quick Service Restaurant Visitors","Value-Conscious Shoppers","Mainstream EV Drivers"],
    conversionType: "QR_Discount", ctaCopy: "See the Menu",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.1, weekend: 1.15 }, targetAffinities: ["suburban","family","shopper"] },
    videoUrl: `${S3}/Applebees+TV+Spot+Return+of+the+Big+Easy+-+iSpot.mp4`,
  },
  {
    externalId: "cmp-037", name: "Olive Garden — Embrace the Obsession",      advertiser: "Darden Restaurants",
    status: "live",    type: "programmatic",  objective: "awareness",       placement: "station-screen",
    flightStart: "2026-02-01", flightEnd: "2026-04-30",
    budget: 75000, spend: 10200, plays: 10200, completionRate: 90.0, pacing: 87, pacingType: "even", frequencyCap: 5,
    baseCpm: 10, sector: "Casual Dining",
    networks: ["chargepoint","blink","bp","electrify"], cities: ["Chicago","Atlanta","Dallas","Phoenix","Denver","Charlotte"],
    msrpTier: "$30K–$50K", vehicleModels: ["Tesla Model Y","Hyundai IONIQ 5","Chevrolet Equinox EV","Volkswagen ID.4"],
    audienceSegments: ["Quick Service Restaurant Visitors","Value-Conscious Shoppers","Mainstream EV Drivers"],
    conversionType: "QR_Discount", ctaCopy: "View Today's Specials",
    targetingRules: { bidMultipliers: { rain: 1.0, lowBattery: 1.1, weekend: 1.2 }, targetAffinities: ["suburban","family","shopper"] },
    videoUrl: `${S3}/Olive+Garden+TV+Spot+Embrace+the+Obsession+-+iSpot.mp4`,
  },
];

// ─── Creatives ────────────────────────────────────────────────────────────────

const CREATIVES = [
  { externalId: "cr-001", type: "video",   name: "Rolex_Perpetual_30s_v3.mp4",                          advertiser: "Rolex SA",                duration: 30, status: "live",   fileSize: "48.2 MB", uploaded: "2026-01-12", aspectRatio: "16:9", completionRate: 96.2 },
  { externalId: "cr-002", type: "video",   name: "Amex_PlatinumDrive_15s.mp4",                          advertiser: "American Express",         duration: 15, status: "live",   fileSize: "22.1 MB", uploaded: "2026-01-28", aspectRatio: "16:9", completionRate: 94.7 },
  { externalId: "cr-003", type: "video",   name: "NetJets_PrivateAboveAll_30s.mp4",                     advertiser: "NetJets Inc.",              duration: 30, status: "live",   fileSize: "51.8 MB", uploaded: "2026-02-07", aspectRatio: "16:9", completionRate: 97.1 },
  { externalId: "cr-004", type: "video",   name: "FourSeasons_WhereElse_30s.mp4",                       advertiser: "Four Seasons Hotels",       duration: 30, status: "review", fileSize: "44.6 MB", uploaded: "2026-02-20", aspectRatio: "16:9", completionRate: null },
  { externalId: "cr-005", type: "video",   name: "Porsche_TaycanConquest_15s_v2.mp4",                   advertiser: "Porsche AG",                duration: 15, status: "live",   fileSize: "19.4 MB", uploaded: "2026-01-18", aspectRatio: "16:9", completionRate: 93.8 },
  { externalId: "cr-006", type: "video",   name: "Hermes_SilentlyRare_30s.mp4",                         advertiser: "Hermès International",      duration: 30, status: "paused", fileSize: "52.0 MB", uploaded: "2025-10-28", aspectRatio: "16:9", completionRate: 95.4 },
  { externalId: "cr-007", type: "video",   name: "BangOlufsen_Theatre_15s.mp4",                         advertiser: "Bang & Olufsen",            duration: 15, status: "live",   fileSize: "21.3 MB", uploaded: "2026-02-13", aspectRatio: "16:9", completionRate: 92.6 },
  { externalId: "cr-008", type: "video",   name: "Bentley_Bentayga_QuietDominance_30s.mp4",             advertiser: "Bentley Motors",            duration: 30, status: "live",   fileSize: "53.4 MB", uploaded: "2026-01-25", aspectRatio: "16:9", completionRate: 97.4 },
  { externalId: "cr-009", type: "video",   name: "PatekPhilippe_GrandComplication_30s.mp4",             advertiser: "Patek Philippe SA",         duration: 30, status: "live",   fileSize: "49.8 MB", uploaded: "2026-01-30", aspectRatio: "16:9", completionRate: 96.8 },
  { externalId: "cr-010", type: "video",   name: "LouisVuitton_SavoirFaire_15s.mp4",                    advertiser: "Louis Vuitton",             duration: 15, status: "live",   fileSize: "23.6 MB", uploaded: "2026-02-06", aspectRatio: "16:9", completionRate: 93.2 },
  { externalId: "cr-011", type: "video",   name: "RollsRoyce_Ghost_Effortless_30s.mp4",                 advertiser: "Rolls-Royce Motor Cars",    duration: 30, status: "live",   fileSize: "55.1 MB", uploaded: "2026-01-08", aspectRatio: "16:9", completionRate: 97.8 },
  { externalId: "cr-012", type: "video",   name: "McLaren_GT_TrackToStreet_15s.mp4",                    advertiser: "McLaren Automotive",        duration: 15, status: "live",   fileSize: "20.8 MB", uploaded: "2026-02-10", aspectRatio: "16:9", completionRate: 94.1 },
  { externalId: "cr-013", type: "video",   name: "Chanel_No5_TimeRunningOut_30s.mp4",                   advertiser: "Chanel S.A.",               duration: 30, status: "live",   fileSize: "47.2 MB", uploaded: "2026-01-22", aspectRatio: "16:9", completionRate: 92.4 },
  { externalId: "cr-014", type: "video",   name: "Lamborghini_Urus_650Reasons_15s.mp4",                 advertiser: "Automobili Lamborghini",    duration: 15, status: "live",   fileSize: "21.9 MB", uploaded: "2026-02-16", aspectRatio: "16:9", completionRate: 95.1 },
  { externalId: "cr-015", type: "video",   name: "TAGHeuer_CodeBreaker_15s.mp4",                        advertiser: "TAG Heuer SA",              duration: 15, status: "live",   fileSize: "18.7 MB", uploaded: "2026-02-18", aspectRatio: "16:9", completionRate: 91.8 },
  { externalId: "cr-016", type: "video",   name: "AstonMartin_DB12_SoulOfAnAston_30s.mp4",              advertiser: "Aston Martin Lagonda",      duration: 30, status: "review", fileSize: "50.3 MB", uploaded: "2026-02-21", aspectRatio: "16:9", completionRate: null },
  { externalId: "cr-017", type: "video",   name: "Nike_WhyDoIt_60s_Barkley_LeBron.mp4",                 advertiser: "Nike Inc.",                 duration: 60, status: "live",   fileSize: "84.2 MB", uploaded: "2026-01-18", aspectRatio: "16:9", completionRate: 94.2, url: `${S3}/Nike+TV+Spot+Why+Do+It+Featuring+Saquon+Barkley+LeBron+James+Scottie+Scheffler+-+iSpot.mp4` },
  { externalId: "cr-018", type: "video",   name: "Apple_iPhone17Pro_SmartGroupSelfies_30s.mp4",          advertiser: "Apple Inc.",                duration: 30, status: "live",   fileSize: "52.6 MB", uploaded: "2026-01-30", aspectRatio: "16:9", completionRate: 93.6, url: `${S3}/Apple+iPhone+17+Pro+TV+Spot+Smart+Group+Selfies+Song+by+Inspector+Spacetime+-+iSpot.mp4` },
  { externalId: "cr-019", type: "video",   name: "Kia_Telluride_XPro_HorseHerder_30s.mp4",              advertiser: "Kia America",               duration: 30, status: "live",   fileSize: "48.1 MB", uploaded: "2026-02-08", aspectRatio: "16:9", completionRate: 93.1, url: `${S3}/2027+Kia+Telluride+X-Pro+TV+Spot+Horse+Herder+T1+-+iSpot.mp4` },
  { externalId: "cr-020", type: "video",   name: "RocketRedfin_YourJourneyHome_30s.mp4",                advertiser: "Rocket Companies",          duration: 30, status: "live",   fileSize: "44.8 MB", uploaded: "2026-02-13", aspectRatio: "16:9", completionRate: 91.8, url: `${S3}/Rocket+%2B+Redfin.+Your+journey+home+just+got+an+upgrade..mp4` },
  { externalId: "cr-021", type: "video",   name: "Target_WellnessPerfectlyPicked_30s.mp4",              advertiser: "Target Corporation",        duration: 30, status: "live",   fileSize: "41.3 MB", uploaded: "2026-01-13", aspectRatio: "16:9", completionRate: 92.8, url: `${S3}/Target+TV+Spot+Wellness+Perfectly+Picked+for+You+-+iSpot.mp4` },
  { externalId: "cr-022", type: "video",   name: "Maybelline_SerumLipstick_EndlessPossibilities_30s.mp4", advertiser: "Maybelline New York",      duration: 30, status: "live",   fileSize: "39.7 MB", uploaded: "2026-02-03", aspectRatio: "16:9", completionRate: 91.4, url: `${S3}/Maybelline+New+York+Serum+Lipstick+TV+Spot+Endless+Possibilities+Featuring+Miley+Cyrus+-+iSpot.mp4` },
  { externalId: "cr-023", type: "video",   name: "PlanetFitness_FinishStrong_30s.mp4",                  advertiser: "Planet Fitness",            duration: 30, status: "live",   fileSize: "36.4 MB", uploaded: "2026-01-26", aspectRatio: "16:9", completionRate: 90.6, url: `${S3}/Planet+Fitness+TV+Spot+Finish+Strong+-+iSpot.mp4` },
  { externalId: "cr-024", type: "video",   name: "Amazon_EssentialsWaterproofMascara_30s.mp4",          advertiser: "Amazon.com Inc.",           duration: 30, status: "live",   fileSize: "38.8 MB", uploaded: "2026-01-18", aspectRatio: "16:9", completionRate: 91.2, url: `${S3}/Amazon+TV+Spot+Essentials+Waterproof+Mascara+-+iSpot.mp4` },
  { externalId: "cr-025", type: "video",   name: "Amazon_TrainRobbery_30s.mp4",                         advertiser: "Amazon.com Inc.",           duration: 30, status: "live",   fileSize: "41.2 MB", uploaded: "2026-01-18", aspectRatio: "16:9", completionRate: 91.8, url: `${S3}/Amazon+TV+Spot+Train+Robbery+-+iSpot+(1).mp4` },
  { externalId: "cr-026", type: "video",   name: "Amazon_Alexa_SuperBowl2026_60s.mp4",                  advertiser: "Amazon.com Inc.",           duration: 60, status: "live",   fileSize: "82.6 MB", uploaded: "2026-02-07", aspectRatio: "16:9", completionRate: 92.4, url: `${S3}/Amazon+Alexa+Super+Bowl+2026+TV+Spot+Chris+Hemsworth+Thinks+Alexa+Is+Scary+Good+-+iSpot.mp4` },
  { externalId: "cr-027", type: "video",   name: "TMobile_HomeInternet_Treadmill_30s.mp4",              advertiser: "T-Mobile US",               duration: 30, status: "live",   fileSize: "40.1 MB", uploaded: "2026-01-23", aspectRatio: "16:9", completionRate: 90.8, url: `${S3}/T-Mobile+Home+Internet+TV+Spot+Treadmill+30+per+Month+Featuring+Zach+Braff+Donald+Faison+-+iSpot.mp4` },
  { externalId: "cr-028", type: "video",   name: "TMobile_GroupPhoto_iPhone17_30s.mp4",                  advertiser: "T-Mobile US",               duration: 30, status: "live",   fileSize: "37.9 MB", uploaded: "2026-01-23", aspectRatio: "16:9", completionRate: 90.4, url: `${S3}/T-Mobile+TV+Spot+Group+Photo+iPhone+17+15-Minute+Switch+Featuring+Harvey+Guilln+Zoe+Saldaa+Druski+-+iSpot.mp4` },
  { externalId: "cr-029", type: "video",   name: "CapitalOne_VentureX_GlobeHopping_30s.mp4",            advertiser: "Capital One Financial",     duration: 30, status: "live",   fileSize: "43.5 MB", uploaded: "2026-02-03", aspectRatio: "16:9", completionRate: 91.6, url: `${S3}/Capital+One+Venture+X+Card+TV+Spot+Globe+Hopping+30+Featuring+Jennifer+Garner+-+iSpot.mp4` },
  { externalId: "cr-030", type: "video",   name: "Panera_MixAndMatch_30s.mp4",                          advertiser: "Panera Bread",              duration: 30, status: "live",   fileSize: "35.6 MB", uploaded: "2026-02-08", aspectRatio: "16:9", completionRate: 90.2, url: `${S3}/Panera+Bread+TV+Spot+Mix+and+Match+499+Each+-+iSpot.mp4` },
  { externalId: "cr-031", type: "video",   name: "Progressive_Sleepover_30s.mp4",                       advertiser: "Progressive Insurance",     duration: 30, status: "live",   fileSize: "36.2 MB", uploaded: "2026-01-20", aspectRatio: "16:9", completionRate: 90.4, url: `${S3}/Progressive+TV+Spot+Sleepover+-+iSpot.mp4` },
  { externalId: "cr-032", type: "video",   name: "LibertyMutual_TruthTellers_DatingApp_30s.mp4",        advertiser: "Liberty Mutual Insurance",  duration: 30, status: "live",   fileSize: "37.4 MB", uploaded: "2026-02-06", aspectRatio: "16:9", completionRate: 90.1, url: `${S3}/Liberty+Mutual+TV+Spot+Truth+Tellers+Dating+App+-+iSpot.mp4` },
  { externalId: "cr-033", type: "video",   name: "Walmart_TheyDontKnowYou_30s.mp4",                     advertiser: "Walmart Inc.",              duration: 30, status: "live",   fileSize: "39.8 MB", uploaded: "2026-01-13", aspectRatio: "16:9", completionRate: 91.8, url: `${S3}/Walmart+TV+Spot+They+Dont+Know+the+First+Thing+About+You+Featuring+Walton+Goggins+-+iSpot.mp4` },
  { externalId: "cr-034", type: "video",   name: "Applebees_ReturnOfTheBigEasy_30s.mp4",                advertiser: "Applebee's (Dine Brands)",  duration: 30, status: "live",   fileSize: "34.8 MB", uploaded: "2026-02-10", aspectRatio: "16:9", completionRate: 89.8, url: `${S3}/Applebees+TV+Spot+Return+of+the+Big+Easy+-+iSpot.mp4` },
  { externalId: "cr-035", type: "video",   name: "OliveGarden_EmbraceTheObsession_30s.mp4",             advertiser: "Darden Restaurants",        duration: 30, status: "live",   fileSize: "35.1 MB", uploaded: "2026-01-30", aspectRatio: "16:9", completionRate: 90.0, url: `${S3}/Olive+Garden+TV+Spot+Embrace+the+Obsession+-+iSpot.mp4` },
  // Display
  { externalId: "cr-d01", type: "display", name: "Hermes_StoreProximity_EndCard_v2.jpg",                advertiser: "Hermès International",      duration: null, status: "live",   fileSize: "1.8 MB",  uploaded: "2026-01-05", aspectRatio: "16:9", completionRate: null, placement: "station-screen" },
  { externalId: "cr-d02", type: "display", name: "Hermes_InApp_Portrait_Banner.jpg",                   advertiser: "Hermès International",      duration: null, status: "paused", fileSize: "0.9 MB",  uploaded: "2026-01-05", aspectRatio: "9:16",  completionRate: null, placement: "in-app" },
  { externalId: "cr-d03", type: "display", name: "Rolex_EndCard_WatchFace_16x9.png",                   advertiser: "Rolex SA",                  duration: null, status: "live",   fileSize: "2.4 MB",  uploaded: "2026-01-14", aspectRatio: "16:9", completionRate: null, placement: "station-screen" },
  { externalId: "cr-d04", type: "display", name: "Chanel_No5_CompanionBanner_v1.jpg",                  advertiser: "Chanel S.A.",               duration: null, status: "review", fileSize: "1.2 MB",  uploaded: "2026-02-18", aspectRatio: "16:9", completionRate: null, placement: "station-screen" },
  { externalId: "cr-d05", type: "display", name: "Bentley_Bentayga_DriveIn_Portrait.png",              advertiser: "Bentley Motors",            duration: null, status: "live",   fileSize: "3.1 MB",  uploaded: "2026-01-26", aspectRatio: "9:16",  completionRate: null, placement: "in-app" },
];

// ─── Stations ─────────────────────────────────────────────────────────────────

const STATIONS = [
  { externalId: "st-001", network: "revel",       city: "New York",      location: "Brooklyn Navy Yard",          stalls: 24, availImps: 184000, floorCpm: 28, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-002", network: "revel",       city: "New York",      location: "Midtown West Hub",             stalls: 16, availImps: 122000, floorCpm: 30, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-003", network: "bp",          city: "New York",      location: "Queens Blvd Corridor",         stalls: 30, availImps: 230000, floorCpm: 14, tier: "standard", formats: ["video"] },
  { externalId: "st-004", network: "evgo",        city: "New York",      location: "Hudson Yards Garage",          stalls: 18, availImps: 140000, floorCpm: 27, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-005", network: "evgo",        city: "Los Angeles",   location: "Playa Vista Station",          stalls: 20, availImps: 156000, floorCpm: 24, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-006", network: "evgo",        city: "Los Angeles",   location: "Century City",                 stalls: 12, availImps: 94000,  floorCpm: 26, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-007", network: "chargepoint", city: "Los Angeles",   location: "Beverly Hills Wilshire",       stalls: 14, availImps: 109000, floorCpm: 23, tier: "premium",  formats: ["video","display"], hwModel: "ct4000" },
  { externalId: "st-008", network: "electrify",   city: "Miami",         location: "Brickell Financial",           stalls: 22, availImps: 172000, floorCpm: 25, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-009", network: "electrify",   city: "Miami",         location: "Design District",              stalls: 10, availImps: 78000,  floorCpm: 27, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-010", network: "revel",       city: "Miami",         location: "South Beach North",            stalls: 12, availImps: 96000,  floorCpm: 26, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-011", network: "chargepoint", city: "San Francisco", location: "SoMa Charging Hub",            stalls: 18, availImps: 138000, floorCpm: 22, tier: "standard", formats: ["video"], hwModel: "cp4000" },
  { externalId: "st-012", network: "evgo",        city: "San Francisco", location: "Financial District",           stalls: 16, availImps: 124000, floorCpm: 24, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-013", network: "chargepoint", city: "Chicago",       location: "River North",                  stalls: 14, availImps: 108000, floorCpm: 18, tier: "standard", formats: ["video"], hwModel: "ct4000" },
  { externalId: "st-014", network: "electrify",   city: "Chicago",       location: "Mag Mile Corridor",            stalls: 20, availImps: 158000, floorCpm: 21, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-015", network: "revel",       city: "Las Vegas",     location: "Strip Corridor North",         stalls: 28, availImps: 218000, floorCpm: 26, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-016", network: "evgo",        city: "Las Vegas",     location: "Wynn Resort Parking",          stalls: 16, availImps: 128000, floorCpm: 28, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-017", network: "applegreen",  city: "Seattle",       location: "South Lake Union",             stalls: 16, availImps: 124000, floorCpm: 16, tier: "standard", formats: ["video"] },
  { externalId: "st-018", network: "chargepoint", city: "Seattle",       location: "Capitol Hill Station",         stalls: 12, availImps: 94000,  floorCpm: 17, tier: "standard", formats: ["video"], hwModel: "express250" },
  { externalId: "st-019", network: "evgo",        city: "Austin",        location: "Domain Northside",             stalls: 18, availImps: 142000, floorCpm: 18, tier: "standard", formats: ["video"] },
  { externalId: "st-020", network: "evgo",        city: "Dallas",        location: "Uptown Energy Corridor",       stalls: 20, availImps: 155000, floorCpm: 15, tier: "standard", formats: ["video"] },
  { externalId: "st-021", network: "bp",          city: "Houston",       location: "River Oaks District",          stalls: 22, availImps: 174000, floorCpm: 14, tier: "standard", formats: ["video"] },
  { externalId: "st-022", network: "electrify",   city: "Atlanta",       location: "Buckhead Village",             stalls: 16, availImps: 126000, floorCpm: 18, tier: "standard", formats: ["video"] },
  { externalId: "st-023", network: "applegreen",  city: "Nashville",     location: "The Gulch",                    stalls: 10, availImps: 80000,  floorCpm: 15, tier: "standard", formats: ["video"] },
  { externalId: "st-024", network: "revel",       city: "Boston",        location: "Seaport Innovation District",  stalls: 20, availImps: 158000, floorCpm: 22, tier: "premium",  formats: ["video","display"] },
  { externalId: "st-025", network: "blink",       city: "New York",      location: "Whole Foods Columbus Circle",   stalls: 10, availImps: 82000,  floorCpm: 21, tier: "premium",  formats: ["video","display"], hwModel: "iq200" },
  { externalId: "st-026", network: "blink",       city: "Los Angeles",   location: "Santa Monica Place Mall",       stalls: 14, availImps: 110000, floorCpm: 20, tier: "premium",  formats: ["video","display"], hwModel: "iq200" },
  { externalId: "st-027", network: "blink",       city: "Miami",         location: "Aventura Mall Garage",          stalls: 18, availImps: 144000, floorCpm: 19, tier: "standard", formats: ["video","display"], hwModel: "iq200" },
  { externalId: "st-028", network: "blink",       city: "Washington DC", location: "Georgetown Waterfront",         stalls: 12, availImps: 96000,  floorCpm: 22, tier: "premium",  formats: ["video","display"], hwModel: "iq200" },
];

// ─── Deterministic pseudo-random helper ──────────────────────────────────────

function rng(i: number, s: number) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5;
  return v - Math.floor(v);
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  VideoEV Neon seed starting…");

  // ── 1. Upsert Accounts ─────────────────────────────────────────────────────
  console.log("  → Accounts…");
  const accountMap: Record<string, string> = {}; // externalId → DB id

  for (const acc of ACCOUNTS) {
    const { externalId, ...rest } = acc;
    const record = await prisma.account.upsert({
      where:  { externalId },
      create: { externalId, ...rest },
      update: { ...rest },
    });
    accountMap[externalId] = record.id;
  }
  console.log(`     ✓ ${Object.keys(accountMap).length} accounts`);

  // ── 2. Upsert Stations ─────────────────────────────────────────────────────
  console.log("  → Stations…");
  for (const st of STATIONS) {
    const { externalId, formats, ...rest } = st;
    await prisma.station.upsert({
      where:  { externalId },
      create: { externalId, formats, ...rest },
      update: { formats, ...rest },
    });
  }
  console.log(`     ✓ ${STATIONS.length} stations`);

  // ── 3. Upsert Creatives ────────────────────────────────────────────────────
  console.log("  → Creatives…");
  for (const cr of CREATIVES) {
    const { externalId, uploaded, ...rest } = cr;
    const uploadedDate = uploaded ? new Date(uploaded) : null;
    await prisma.creative.upsert({
      where:  { externalId },
      create: { externalId, uploaded: uploadedDate, ...rest },
      update: { uploaded: uploadedDate, ...rest },
    });
  }
  console.log(`     ✓ ${CREATIVES.length} creatives`);

  // ── 4. Upsert Campaigns ────────────────────────────────────────────────────
  console.log("  → Campaigns…");
  const campaignMap: Record<string, string> = {}; // externalId → DB id

  for (const cmp of CAMPAIGNS) {
    const { externalId, advertiser, flightStart, flightEnd, networks, cities,
            vehicleModels, audienceSegments, targetingRules, ...rest } = cmp;

    const accountExternalId = ADVERTISER_ACCOUNT_MAP[advertiser];
    const accountId = accountExternalId ? accountMap[accountExternalId] : null;

    const record = await prisma.campaign.upsert({
      where:  { externalId },
      create: {
        externalId,
        advertiser,
        accountId,
        flightStart:      flightStart ? new Date(flightStart) : null,
        flightEnd:        flightEnd   ? new Date(flightEnd)   : null,
        networks:         networks         ?? [],
        cities:           cities           ?? [],
        vehicleModels:    vehicleModels    ?? [],
        audienceSegments: audienceSegments ?? [],
        targetingRules:   targetingRules   as object,
        ...rest,
      },
      update: {
        advertiser,
        accountId,
        flightStart:      flightStart ? new Date(flightStart) : null,
        flightEnd:        flightEnd   ? new Date(flightEnd)   : null,
        networks:         networks         ?? [],
        cities:           cities           ?? [],
        vehicleModels:    vehicleModels    ?? [],
        audienceSegments: audienceSegments ?? [],
        targetingRules:   targetingRules   as object,
        ...rest,
      },
    });
    campaignMap[externalId] = record.id;
  }
  console.log(`     ✓ ${Object.keys(campaignMap).length} campaigns`);

  // ── 5. Synthetic TrackingEvents ────────────────────────────────────────────
  console.log("  → TrackingEvents…");
  let totalEvents = 0;

  for (const cmp of CAMPAIGNS) {
    if (cmp.plays === 0) continue;

    const campaignId = campaignMap[cmp.externalId];
    const eventCount = Math.min(Math.round(cmp.plays / 1000), 50); // cap at 50 per campaign
    const revenuePerPlay = cmp.baseCpm / 1000;

    // Delete existing synthetic events for this campaign to allow re-seeding
    await prisma.trackingEvent.deleteMany({ where: { campaignId } });

    const events = [];
    for (let i = 0; i < eventCount; i++) {
      const sessionId = `seed-${cmp.externalId}-${i.toString().padStart(4, "0")}`;
      const daysAgo  = Math.floor(rng(i, 42) * 90);  // spread over last 90 days
      const ts       = new Date(Date.now() - daysAgo * 86400000);
      const isComplete = rng(i, 7) < (cmp.completionRate / 100);

      events.push({ campaignId, sessionId, eventType: "impression", revenue: null, createdAt: ts });
      events.push({ campaignId, sessionId, eventType: "start",      revenue: null, createdAt: new Date(ts.getTime() + 500) });
      if (isComplete) {
        events.push({
          campaignId,
          sessionId,
          eventType: "complete",
          revenue: revenuePerPlay,
          createdAt: new Date(ts.getTime() + (cmp.duration ?? 30) * 1000),
        });
      }
      // ~2% QR scan rate
      if (rng(i, 13) < 0.021) {
        events.push({ campaignId, sessionId, eventType: "qr_scan", revenue: revenuePerPlay * 0.5, createdAt: new Date(ts.getTime() + 5000) });
      }
    }

    await prisma.trackingEvent.createMany({ data: events });
    totalEvents += events.length;
  }
  console.log(`     ✓ ${totalEvents} tracking events`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.account.count(),
    prisma.campaign.count(),
    prisma.creative.count(),
    prisma.station.count(),
    prisma.trackingEvent.count(),
  ]);
  console.log(`\n✅  Seed complete:`);
  console.log(`     Accounts:       ${counts[0]}`);
  console.log(`     Campaigns:      ${counts[1]}`);
  console.log(`     Creatives:      ${counts[2]}`);
  console.log(`     Stations:       ${counts[3]}`);
  console.log(`     TrackingEvents: ${counts[4]}`);
}

main()
  .catch((e) => { console.error("❌  Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
