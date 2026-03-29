// ─── Ad Generator ─────────────────────────────────────────────────────────────
// Programmatically generates 315 ad units across 12 sectors.
// Each ad carries bidMultipliers, conversion metadata, a QR code URL, and
// targetAffinities for the weighted scoring engine in /api/decision/route.ts.

export type ConversionType = "QR_Discount" | "Lead_Gen" | "App_Install";

export interface BidMultipliers {
  rain: number;
  lowBattery: number;
  weekend: number;
}

export interface Conversion {
  type: ConversionType;
  value: string;
}

export interface Ad {
  id: string;
  brand: string;
  sector: string;
  baseCpm: number;
  bidMultipliers: BidMultipliers;
  conversion: Conversion;
  qrCodeUrl: string;
  targetAffinities: string[];
  videoUrl: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

// [brand, baseCpm, [aff1, aff2, aff3], conversionValue]
type BrandEntry = [string, number, [string, string, string], string];

interface SectorDef {
  prefix: string;
  sector: string;
  conversionType: ConversionType;
  multipliers: BidMultipliers;
  brands: BrandEntry[];
}

const S3 = "https://videoev.s3.us-east-1.amazonaws.com";
const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://videoev.com/conversion/";

function slug(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

// ─── Sector Definitions ───────────────────────────────────────────────────────

const SECTORS: SectorDef[] = [

  // ── Financial (26) ──────────────────────────────────────────────────────────
  {
    prefix: "fin",
    sector: "Financial",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.1, lowBattery: 1.1, weekend: 1.2 },
    brands: [
      ["Chase",              32, ["high_net_worth", "commuter",        "urban"],            "Open a Sapphire account, earn 80K points"],
      ["American Express",   48, ["high_net_worth", "traveler",        "luxury_buyer"],     "Earn 5× points on travel & dining"],
      ["Goldman Sachs",      55, ["high_net_worth", "investor",        "affluent"],         "Schedule a free portfolio review"],
      ["Morgan Stanley",     52, ["high_net_worth", "investor",        "tech_professional"],"Get a complimentary wealth plan"],
      ["Fidelity",           35, ["investor",        "family",          "commuter"],         "Start investing with $0 commissions"],
      ["Charles Schwab",     33, ["investor",        "commuter",        "affluent"],         "Open a brokerage account today"],
      ["Vanguard",           30, ["investor",        "long_term",       "family"],           "Low-cost index funds since 1975"],
      ["Citi",               28, ["traveler",        "commuter",        "urban"],            "Earn cash back on every purchase"],
      ["Wells Fargo",        25, ["family",          "homeowner",       "suburban"],         "Open a Premier Checking account"],
      ["Bank of America",    27, ["family",          "commuter",        "homeowner"],        "Preferred Rewards up to 3.5× points"],
      ["Robinhood",          22, ["young_professional","investor",      "tech_enthusiast"],  "Trade stocks with zero commission"],
      ["SoFi",               26, ["young_professional","refinance",     "commuter"],         "Refinance student loans, save thousands"],
      ["Ally Bank",          24, ["online_native",   "saver",           "family"],           "4.20% APY — no fees, no minimums"],
      ["Betterment",         27, ["investor",        "automated",       "millennial"],       "Automated investing starting at $10"],
      ["Wealthfront",        26, ["investor",        "tech_professional","automated"],       "Smart investing with tax-loss harvesting"],
      ["Coinbase",           32, ["tech_enthusiast", "investor",        "young_professional"],"Earn rewards on your first crypto buy"],
      ["PayPal",             20, ["online_native",   "shopper",         "commuter"],         "Send money instantly, no fees"],
      ["Venmo",              16, ["millennial",      "social",          "urban"],            "Split bills instantly with friends"],
      ["Cash App",           18, ["young_professional","urban",         "social"],           "Get $15 when you send your first payment"],
      ["Mastercard",         42, ["high_net_worth",  "traveler",        "affluent"],         "World Elite Mastercard — no foreign fees"],
      ["Discover",           24, ["family",          "cashback",        "commuter"],         "5% cash back, no annual fee"],
      ["E*TRADE",            29, ["investor",        "trader",          "affluent"],         "Advanced trading tools, free for 60 days"],
      ["Stripe",             38, ["tech_professional","entrepreneur",   "b2b"],              "Accept payments globally — sign up free"],
      ["USAA",               30, ["military",        "family",          "homeowner"],        "Exclusive rates for military families"],
      ["Marcus by Goldman",  28, ["saver",           "affluent",        "online_native"],    "High-yield savings — no fees ever"],
      ["JP Morgan",          58, ["high_net_worth",  "investor",        "ultra_luxury"],     "JP Morgan Private Client — by invitation"],
      ["Truist",             24, ["family",          "commuter",        "suburban"],         "Truist One — no overdraft fees, ever"],
      ["Acorns",             20, ["millennial",      "investor",        "young_professional"],"Invest spare change — Acorns app free"],
      ["Stash",              18, ["young_professional","investor",      "online_native"],    "Start investing for $1 — Stash app"],
      ["Plaid",              36, ["tech_professional","b2b",            "entrepreneur"],     "Plaid Link — connect your bank, build faster"],
    ],
  },

  // ── Luxury (26) ─────────────────────────────────────────────────────────────
  {
    prefix: "lux",
    sector: "Luxury",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.3 },
    brands: [
      ["Tiffany & Co.",      62, ["high_net_worth",  "luxury_buyer",    "gifting"],          "Book a private styling consultation"],
      ["Cartier",            70, ["high_net_worth",  "luxury_buyer",    "traveler"],         "Visit a Cartier boutique near you"],
      ["Rolex",              75, ["high_net_worth",  "affluent",        "achiever"],         "Discover the Oyster Perpetual collection"],
      ["Louis Vuitton",      80, ["high_net_worth",  "traveler",        "luxury_buyer"],     "Explore new arrivals at LV.com"],
      ["Gucci",              72, ["high_net_worth",  "fashionista",     "luxury_buyer"],     "Book an in-store appointment at Gucci"],
      ["Prada",              68, ["high_net_worth",  "luxury_buyer",    "fashionista"],      "Discover Prada's new runway collection"],
      ["Hermès",             85, ["high_net_worth",  "ultra_luxury",    "gifting"],          "Request a private Hermès appointment"],
      ["Chanel",             78, ["high_net_worth",  "fashionista",     "luxury_buyer"],     "Explore Chanel's fine jewelry atelier"],
      ["Patek Philippe",     90, ["high_net_worth",  "ultra_luxury",    "collector"],        "Schedule an authorised dealer visit"],
      ["Dior",               72, ["high_net_worth",  "fashionista",     "luxury_buyer"],     "Discover Dior beauty & fashion"],
      ["Bulgari",            66, ["high_net_worth",  "luxury_buyer",    "traveler"],         "Book a BVLGARI hotel experience"],
      ["Breitling",          65, ["high_net_worth",  "aviator",         "achiever"],         "Book a Breitling boutique appointment"],
      ["TAG Heuer",          58, ["high_net_worth",  "sporty",          "achiever"],         "Schedule a TAG Heuer fitting"],
      ["Versace",            64, ["high_net_worth",  "fashionista",     "urban"],            "Explore Versace's signature styles"],
      ["Bottega Veneta",     70, ["high_net_worth",  "understated_luxury","affluent"],       "Discover Bottega's intreccio craft"],
      ["Balenciaga",         66, ["high_net_worth",  "streetwear",      "fashionista"],      "Explore new Balenciaga drops"],
      ["Saint Laurent",      68, ["high_net_worth",  "fashionista",     "luxury_buyer"],     "Explore YSL's latest collection"],
      ["Burberry",           60, ["high_net_worth",  "traveler",        "british_heritage"], "Shop the iconic Burberry trench"],
      ["Audemars Piguet",    88, ["high_net_worth",  "ultra_luxury",    "collector"],        "Request an AP Royal Oak consultation"],
      ["Chopard",            72, ["high_net_worth",  "gifting",         "luxury_buyer"],     "Discover Happy Diamonds fine jewels"],
      ["Maserati",           55, ["high_net_worth",  "performance",     "luxury_buyer"],     "Book a Maserati test drive"],
      ["Aston Martin",       55, ["high_net_worth",  "performance",     "ultra_luxury"],     "Configure your Aston Martin today"],
      ["Bentley",            55, ["high_net_worth",  "ultra_luxury",    "comfort_seeker"],   "Book a Bentley bespoke consultation"],
      ["IWC Schaffhausen",   70, ["high_net_worth",  "aviator",         "collector"],        "Visit an IWC boutique for a fitting"],
      ["Rolls-Royce",        55, ["high_net_worth",  "ultra_luxury",    "chauffeur"],        "Request a Rolls-Royce private viewing"],
      ["Omega",              65, ["high_net_worth",  "achiever",        "sporty"],           "Discover the Seamaster collection"],
    ],
  },

  // ── Pharma / Health (26) ────────────────────────────────────────────────────
  {
    prefix: "pha",
    sector: "Pharma",
    conversionType: "App_Install",
    multipliers: { rain: 1.2, lowBattery: 1.3, weekend: 1.0 },
    brands: [
      ["CVS Health",         20, ["family",           "health_conscious", "suburban"],       "Download the CVS app — Rx reminders"],
      ["Walgreens",          18, ["family",           "commuter",         "health_conscious"],"Download the Walgreens app — weekly deals"],
      ["GoodRx",             22, ["cost_conscious",   "family",           "commuter"],        "Save up to 80% on prescriptions"],
      ["Hims & Hers",        28, ["millennial",       "health_conscious", "urban"],           "Download the Hims app — telehealth in mins"],
      ["Teladoc",            22, ["family",           "convenience",      "suburban"],        "Book a Teladoc visit — no waitroom"],
      ["One Medical",        30, ["affluent",         "health_conscious", "urban"],           "Join One Medical — same-day appointments"],
      ["Noom",               20, ["health_conscious", "millennial",       "family"],          "Start Noom — free 14-day trial"],
      ["Novo Nordisk",       38, ["health_conscious", "affluent",         "family"],          "Learn about Ozempic — talk to your doctor"],
      ["Abbott",             30, ["health_conscious", "family",           "achiever"],        "Download the FreeStyle LibreLink app"],
      ["Pfizer",             35, ["family",           "health_conscious", "suburban"],        "Pfizer.com — ask about prevention"],
      ["Advil",              16, ["commuter",         "active",           "family"],          "Save $3 on Advil — print coupon"],
      ["Tylenol",            14, ["family",           "parent",           "suburban"],        "Save $2 on Tylenol products"],
      ["Claritin",           15, ["outdoor_enthusiast","family",          "suburban"],        "Download the Claritin allergy forecast app"],
      ["Zyrtec",             16, ["outdoor_enthusiast","commuter",        "family"],          "Save $4 on Zyrtec — 24-hour relief"],
      ["Allegra",            14, ["outdoor_enthusiast","suburban",        "active"],          "Non-drowsy allergy relief — save $2"],
      ["MDLive",             20, ["convenience",      "commuter",         "suburban"],        "MDLive — virtual care in under 15 min"],
      ["HealthMarkets",      20, ["family",           "self_employed",    "suburban"],        "Compare health plans — free consult"],
      ["Optum",              32, ["corporate",        "health_conscious", "family"],          "Optum Health — whole-person care"],
      ["Ro (Roman)",         25, ["millennial",       "health_conscious", "male"],            "Get treatment from home — discreet delivery"],
      ["MedExpress",         18, ["commuter",         "suburban",         "family"],          "Walk in today — no appointment needed"],
      ["Perrigo",            14, ["cost_conscious",   "family",           "suburban"],        "Quality store-brand medicine — save now"],
      ["Merck",              32, ["health_conscious", "affluent",         "senior"],          "Merck.com — talk to your pharmacist"],
      ["AstraZeneca",        30, ["health_conscious", "family",           "corporate"],       "AstraZeneca — life-changing medicines"],
      ["Johnson & Johnson",  28, ["family",           "parent",           "health_conscious"],"J&J — for families who care"],
      ["Bayer",              26, ["family",           "active",           "health_conscious"],"Save $5 on any Bayer product"],
      ["Moderna",            32, ["health_conscious", "family",           "suburban"],        "Ask your pharmacist about mRNA vaccines"],
      ["ZocDoc",             24, ["convenience",      "urban",            "health_conscious"], "ZocDoc — book a doctor in minutes, free"],
      ["Capsule",            22, ["urban",            "commuter",         "health_conscious"], "Capsule pharmacy — free same-day delivery"],
    ],
  },

  // ── Legal (17) ──────────────────────────────────────────────────────────────
  {
    prefix: "leg",
    sector: "Legal",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.1, lowBattery: 1.0, weekend: 1.1 },
    brands: [
      ["LegalZoom",          22, ["entrepreneur",    "small_business",  "suburban"],         "Form an LLC for $0 + state fees"],
      ["Rocket Lawyer",      20, ["entrepreneur",    "family",          "homeowner"],        "Free legal advice — first week free"],
      ["JustAnswer",         18, ["family",          "homeowner",       "suburban"],         "Get a legal answer in minutes"],
      ["Morgan & Morgan",    28, ["accident_prone",  "family",          "commuter"],         "Injured? Call for a free consultation"],
      ["LegalShield",        18, ["family",          "small_business",  "commuter"],         "$24.95/month for unlimited legal advice"],
      ["FindLaw",            15, ["family",          "homeowner",       "commuter"],         "Find a lawyer near you — free search"],
      ["Avvo",               14, ["urban",           "renter",          "commuter"],         "Ask a lawyer free — 1 min response"],
      ["LawDepot",           16, ["entrepreneur",    "small_business",  "homeowner"],        "Legal forms in minutes — save 60%"],
      ["Martindale",         18, ["affluent",        "homeowner",       "suburban"],         "Find top-rated lawyers in your area"],
      ["Jacoby & Meyers",    20, ["commuter",        "accident_prone",  "family"],           "Accident claim? No fee unless we win"],
      ["Nolo",               14, ["entrepreneur",    "self_employed",   "homeowner"],        "DIY legal guides — save on attorney fees"],
      ["US Legal Services",  16, ["family",          "employee",        "suburban"],         "Legal protection for you and your family"],
      ["Class Action Connect",20,["consumer",        "family",          "commuter"],         "In a class action? Check your eligibility"],
      ["Injury Help Hotline",22, ["commuter",        "accident_prone",  "family"],           "Free injury claim review — call now"],
      ["Rocket Legal+",      22, ["small_business",  "entrepreneur",    "homeowner"],        "Upgrade to unlimited legal docs today"],
      ["Lawline",            18, ["corporate",       "professional",    "urban"],            "CLE courses for attorneys — 10% off"],
      ["LawReader",          15, ["entrepreneur",    "self_employed",   "commuter"],         "Plain-English legal documents — free trial"],
      ["LegalNature",        16, ["entrepreneur",    "small_business",  "homeowner"],        "Professional legal forms — 50% off today"],
      ["LawGeex",            20, ["corporate",       "b2b",             "entrepreneur"],     "AI contract review — book a free demo"],
      ["Avvo Pro",           18, ["urban",           "professional",    "commuter"],         "Find a top-rated lawyer — Avvo Pro"],
    ],
  },

  // ── Home Services (27) ──────────────────────────────────────────────────────
  {
    prefix: "hsv",
    sector: "Home Services",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.4, lowBattery: 1.0, weekend: 1.3 },
    brands: [
      ["Angi",               18, ["homeowner",       "suburban",        "family"],           "Get 3 free quotes from local pros"],
      ["TaskRabbit",         16, ["urban",           "renter",          "millennial"],       "Book a Tasker in under 5 minutes"],
      ["Handy",              15, ["renter",          "urban",           "convenience"],      "Book a home cleaner — $29 first clean"],
      ["Thumbtack",          16, ["homeowner",       "suburban",        "diy_helper"],       "Find a local pro in minutes"],
      ["ADT",                22, ["homeowner",       "family",          "suburban"],         "Save $200 on ADT smart home security"],
      ["Vivint",             26, ["homeowner",       "tech_enthusiast", "family"],           "Free smart home system installation"],
      ["Sunrun",             28, ["homeowner",       "eco_conscious",   "suburban"],         "Go solar — $0 down, save from day 1"],
      ["Terminix",           18, ["homeowner",       "suburban",        "family"],           "Guaranteed pest control — $50 off"],
      ["Orkin",              16, ["homeowner",       "suburban",        "family"],           "First service free — Orkin Protection"],
      ["Stanley Steemer",    14, ["homeowner",       "family",          "suburban"],         "Carpet cleaning — book & save 20%"],
      ["Molly Maid",         15, ["homeowner",       "busy_professional","suburban"],        "First cleaning 20% off — book today"],
      ["Roto-Rooter",        16, ["homeowner",       "suburban",        "family"],           "24/7 plumbing & drain service"],
      ["Mr. Appliance",      14, ["homeowner",       "family",          "suburban"],         "Appliance repair — same-day available"],
      ["HelloTech",          18, ["tech_enthusiast", "homeowner",       "suburban"],         "In-home tech setup starting at $49"],
      ["ServiceMaster",      16, ["homeowner",       "suburban",        "family"],           "Disaster restoration — free estimate"],
      ["TruGreen",           18, ["homeowner",       "suburban",        "curb_appeal"],      "Lawn care plan — first application free"],
      ["Porch",              14, ["homeowner",       "diy_helper",      "suburban"],         "Find trusted home pros near you"],
      ["ServPro",            18, ["homeowner",       "suburban",        "family"],           "Fire & water damage — 24/7 response"],
      ["Mr. Electric",       16, ["homeowner",       "suburban",        "family"],           "Electrician on demand — free estimate"],
      ["Aire Serv",          16, ["homeowner",       "suburban",        "climate_sensitive"],"HVAC tune-up — book for $79"],
      ["Sears Home Services",16, ["homeowner",       "suburban",        "family"],           "Appliance repair — Sears certified techs"],
      ["Two Men and a Truck", 15,["mover",           "suburban",        "family"],           "Moving estimate — free in 2 minutes"],
      ["PODS",               20, ["mover",           "homeowner",       "suburban"],         "Free PODS container — 1-month storage"],
      ["1-800-GOT-JUNK",     14, ["homeowner",       "downsizer",       "suburban"],         "Junk removal — $30 off your first haul"],
      ["Carvana Home",       20, ["homeowner",       "tech_enthusiast", "suburban"],         "Buy or sell your home online — Carvana"],
      ["Home Depot",         22, ["homeowner",       "diy_helper",      "suburban"],         "10% off any online order — HomeDepot.com"],
      ["Lowe's",             20, ["homeowner",       "diy_helper",      "suburban"],         "Spring sale — save up to 40% on tools"],
    ],
  },

  // ── Furniture (21) ──────────────────────────────────────────────────────────
  {
    prefix: "fur",
    sector: "Furniture",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.2, lowBattery: 1.0, weekend: 1.4 },
    brands: [
      ["IKEA",               16, ["homeowner",       "millennial",      "value_seeker"],     "New arrivals — visit your nearest IKEA"],
      ["Pottery Barn",       28, ["homeowner",       "affluent",        "nesting"],          "Free in-home design consultation"],
      ["West Elm",           26, ["millennial",      "homeowner",       "design_conscious"], "Free shipping on orders over $200"],
      ["RH",                 55, ["high_net_worth",  "affluent",        "nesting"],          "Book an RH Interior Design consultation"],
      ["Crate & Barrel",     30, ["homeowner",       "affluent",        "design_conscious"], "New collection — shop Crate & Barrel"],
      ["Williams-Sonoma",    32, ["homeowner",       "affluent",        "cook"],             "Free shipping on cookware orders $99+"],
      ["Wayfair",            22, ["homeowner",       "value_seeker",    "online_native"],    "Daily deals — save up to 60%"],
      ["Ashley Furniture",   18, ["homeowner",       "family",          "suburban"],         "0% financing for 48 months — shop now"],
      ["La-Z-Boy",           16, ["homeowner",       "comfort_seeker",  "suburban"],         "Save $300 on custom recliners"],
      ["Ethan Allen",        28, ["homeowner",       "affluent",        "traditional"],      "Free in-home design service"],
      ["Arhaus",             32, ["homeowner",       "design_conscious","affluent"],         "Book an Arhaus design studio visit"],
      ["CB2",                24, ["urban",           "millennial",      "design_conscious"], "20% off your first CB2 order"],
      ["Article",            20, ["millennial",      "homeowner",       "design_conscious"], "Modern furniture — free returns"],
      ["Joybird",            18, ["millennial",      "homeowner",       "personalization"],  "Build your custom sofa — from $999"],
      ["Design Within Reach",38, ["affluent",        "design_conscious","urban"],            "Visit a DWR studio for a free consult"],
      ["Serena & Lily",      34, ["affluent",        "nesting",         "coastal"],          "Free design services — serenaandlily.com"],
      ["Anthropologie Home", 30, ["fashionista",     "homeowner",       "design_conscious"], "Explore Anthropologie's home collection"],
      ["Z Gallerie",         22, ["urban",           "design_conscious","millennial"],       "Glam décor — 15% off your first order"],
      ["Benchmade Modern",   26, ["homeowner",       "design_conscious","affluent"],         "Custom sofas in 6 weeks — free swatch kit"],
      ["Restoration Hardware",50,["high_net_worth",  "affluent",        "nesting"],          "RH Members save 25% — join today"],
      ["Floyd",              24, ["millennial",      "urban",           "design_conscious"], "Modular furniture for modern living"],
      ["Overstock",          20, ["homeowner",       "value_seeker",    "online_native"],    "Overstock — up to 70% off furniture today"],
      ["Room & Board",       36, ["affluent",        "design_conscious","homeowner"],        "American-made furniture — free design services"],
      ["Cozey",              22, ["millennial",      "homeowner",       "online_native"],    "Build-your-own sofa — ships in 2 weeks"],
      ["Castlery",           24, ["millennial",      "design_conscious","homeowner"],        "Designer furniture at honest prices"],
    ],
  },

  // ── Travel (26) ─────────────────────────────────────────────────────────────
  {
    prefix: "trv",
    sector: "Travel",
    conversionType: "QR_Discount",
    multipliers: { rain: 1.0, lowBattery: 1.0, weekend: 1.4 },
    brands: [
      ["Delta Air Lines",    42, ["traveler",        "business_class",  "high_net_worth"],   "Earn 50K SkyMiles — limited offer"],
      ["United Airlines",    38, ["traveler",        "commuter",        "business_class"],   "Earn 60K miles with MileagePlus card"],
      ["American Airlines",  36, ["traveler",        "commuter",        "family"],           "AAdvantage 50K mile bonus — apply today"],
      ["JetBlue",            28, ["traveler",        "millennial",      "leisure"],          "20% off your next JetBlue fare"],
      ["Emirates",           65, ["high_net_worth",  "traveler",        "luxury_buyer"],     "Business class upgrade — Emirates.com"],
      ["British Airways",    55, ["high_net_worth",  "traveler",        "business_class"],   "Earn Avios on every mile you fly"],
      ["Marriott Bonvoy",    45, ["traveler",        "business_class",  "affluent"],         "Earn 3 free nights with Bonvoy card"],
      ["Hilton Honors",      42, ["traveler",        "business_class",  "commuter"],         "Free weekend night with Hilton Honors"],
      ["Hyatt",              50, ["traveler",        "affluent",        "luxury_buyer"],     "60K World of Hyatt points — new card offer"],
      ["Four Seasons",       80, ["high_net_worth",  "ultra_luxury",    "traveler"],         "Book Four Seasons — complimentary upgrade"],
      ["Ritz-Carlton",       85, ["high_net_worth",  "ultra_luxury",    "traveler"],         "Ritz-Carlton Rewards — 2 nights free"],
      ["Airbnb",             32, ["traveler",        "millennial",      "leisure"],          "$50 off your next Airbnb stay"],
      ["Expedia",            30, ["traveler",        "family",          "value_seeker"],     "Bundle & save — up to $500 off trips"],
      ["Booking.com",        28, ["traveler",        "value_seeker",    "online_native"],    "Genius loyalty — extra 15% off hotels"],
      ["Norwegian Cruise",   52, ["traveler",        "leisure",         "affluent"],         "Free open bar + specialty dining deal"],
      ["Royal Caribbean",    48, ["traveler",        "family",          "leisure"],          "Kids sail free — book by end of month"],
      ["Celebrity Cruises",  58, ["traveler",        "affluent",        "luxury_buyer"],     "All-included cruise — save up to $600"],
      ["Alaska Airlines",    32, ["traveler",        "commuter",        "leisure"],          "Earn 50K Mileage Plan miles — apply now"],
      ["Southwest",          26, ["value_seeker",    "traveler",        "family"],           "Companion pass — fly 2, pay for 1"],
      ["TripAdvisor",        20, ["traveler",        "research_driven", "family"],           "Book with confidence — best price guarantee"],
      ["Kayak",              22, ["traveler",        "value_seeker",    "tech_enthusiast"],  "Price alerts — get notified of fare drops"],
      ["Sandals Resorts",    55, ["traveler",        "couple",          "luxury_buyer"],     "All-inclusive Caribbean — save $400"],
      ["Vrbo",               28, ["traveler",        "family",          "homeowner"],        "$100 off your first Vrbo stay"],
      ["Priceline",          20, ["value_seeker",    "traveler",        "spontaneous"],      "Name your price — save up to 60%"],
      ["Hotels.com",         24, ["traveler",        "value_seeker",    "family"],           "Collect 10 nights, get 1 free"],
      ["Holland America",    48, ["traveler",        "senior",          "leisure"],          "World cruise — book early & save $1,200"],
    ],
  },

  // ── Insurance (22) ──────────────────────────────────────────────────────────
  {
    prefix: "ins",
    sector: "Insurance",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.3, lowBattery: 1.2, weekend: 1.0 },
    brands: [
      ["State Farm",         28, ["homeowner",       "family",          "suburban"],         "Get a free State Farm auto quote"],
      ["Allstate",           26, ["homeowner",       "family",          "commuter"],         "Save up to 45% by bundling home + auto"],
      ["GEICO",              22, ["commuter",        "value_seeker",    "family"],           "15 minutes could save you 15% or more"],
      ["Progressive",        20, ["commuter",        "value_seeker",    "young_driver"],     "Name your price tool — custom coverage"],
      ["Farmers",            24, ["homeowner",       "family",          "suburban"],         "Free Farmers insurance review today"],
      ["Liberty Mutual",     22, ["family",          "homeowner",       "commuter"],         "Customized coverage — only pay for what you need"],
      ["Nationwide",         22, ["homeowner",       "family",          "suburban"],         "On your side — free online quote"],
      ["Travelers",          24, ["homeowner",       "affluent",        "family"],           "Travelers IntelliDrive — pay per mile"],
      ["Lemonade",           26, ["renter",          "urban",           "millennial"],       "Renters insurance from $5/month"],
      ["Hippo Insurance",    24, ["homeowner",       "tech_enthusiast", "suburban"],         "Modern home insurance — get a quote"],
      ["Amica",              26, ["homeowner",       "affluent",        "family"],           "Amica — top-rated for claims service"],
      ["MetLife",            24, ["family",          "corporate",       "homeowner"],        "MetLife group benefits — ask HR today"],
      ["Prudential",         28, ["affluent",        "family",          "long_term"],        "Life insurance — protect what matters most"],
      ["Chubb",              35, ["high_net_worth",  "affluent",        "homeowner"],        "Chubb Masterpiece — high-value home coverage"],
      ["USAA Insurance",     30, ["military",        "family",          "homeowner"],        "USAA — serving those who served"],
      ["AIG",                30, ["affluent",        "homeowner",       "investor"],         "AIG Private Client — premium protection"],
      ["Erie Insurance",     22, ["homeowner",       "family",          "suburban"],         "Erie — above and beyond coverage"],
      ["Auto-Owners",        22, ["homeowner",       "family",          "suburban"],         "An independent agency that cares"],
      ["The Hartford",       26, ["small_business",  "homeowner",       "senior"],           "AARP auto + home — save with Hartford"],
      ["Country Financial",  20, ["homeowner",       "rural",           "family"],           "Local agents who know your community"],
      ["Hiscox",             28, ["entrepreneur",    "small_business",  "b2b"],              "Small business insurance from $22/month"],
      ["Root Insurance",     18, ["young_driver",    "tech_enthusiast", "urban"],            "Car insurance based on how you drive"],
      ["Cigna",              28, ["corporate",       "family",          "health_conscious"], "Cigna — employer health plans, get a quote"],
      ["Oscar Health",       24, ["urban",           "millennial",      "health_conscious"], "Oscar Health — easy health insurance"],
      ["Sun Life",           26, ["corporate",       "family",          "long_term"],        "Sun Life group benefits — speak to an advisor"],
    ],
  },

  // ── QSR (26) ────────────────────────────────────────────────────────────────
  {
    prefix: "qsr",
    sector: "QSR",
    conversionType: "QR_Discount",
    multipliers: { rain: 1.3, lowBattery: 1.5, weekend: 1.2 },
    brands: [
      ["McDonald's",         22, ["commuter",        "family",          "value_seeker"],     "$2 off any value meal — scan to redeem"],
      ["Starbucks",          28, ["commuter",        "morning",         "professional"],     "$1 off any handcrafted beverage"],
      ["Chipotle",           24, ["millennial",      "health_conscious","commuter"],         "Free chips & guac with entrée — scan now"],
      ["Taco Bell",          18, ["millennial",      "young_professional","urban"],          "Buy 1 Crunchwrap, get 1 50% off"],
      ["Chick-fil-A",        22, ["family",          "suburban",        "health_conscious"], "Free sandwich with app download"],
      ["Shake Shack",        26, ["urban",           "affluent",        "foodie"],           "$3 off your next ShackBurger order"],
      ["Dunkin'",            20, ["commuter",        "morning",         "value_seeker"],     "Free medium drink with any food purchase"],
      ["Panera Bread",       20, ["professional",    "health_conscious","commuter"],         "Panera Unlimited Sip Club — $11.99/month"],
      ["Wendy's",            16, ["commuter",        "family",          "value_seeker"],     "$1 Frosty with any purchase — scan now"],
      ["Burger King",        18, ["commuter",        "family",          "value_seeker"],     "2 Whoppers for $6 — Burger King app"],
      ["Subway",             16, ["commuter",        "health_conscious","value_seeker"],     "BOGO footlong — Subway app deal"],
      ["Domino's",           18, ["family",          "evening",         "value_seeker"],     "50% off all menu-price pizzas online"],
      ["Pizza Hut",          16, ["family",          "suburban",        "value_seeker"],     "$10 large pizza — Pizza Hut app"],
      ["KFC",                16, ["commuter",        "family",          "value_seeker"],     "8-piece meal for $10 — limited time"],
      ["Popeyes",            18, ["commuter",        "family",          "value_seeker"],     "Free sandwich with $15 app purchase"],
      ["Five Guys",          20, ["urban",           "foodie",          "young_professional"],"Free regular fries with burger order"],
      ["Wingstop",           18, ["millennial",      "urban",           "sports_fan"],       "10 wings for $10 — Wingstop app"],
      ["Raising Cane's",     20, ["millennial",      "commuter",        "value_seeker"],     "Box combo for $8.99 — Cane's loyalty app"],
      ["In-N-Out",           24, ["commuter",        "value_seeker",    "west_coast"],       "Animal style — always fresh, always free"],
      ["Dairy Queen",        14, ["family",          "suburban",        "value_seeker"],     "Blizzard of the Month — 2 for $5"],
      ["Sonic",              15, ["commuter",        "suburban",        "value_seeker"],     "Half-price drinks & slushes — happy hour"],
      ["Whataburger",        18, ["commuter",        "south_texas",     "value_seeker"],     "Honey Butter Chicken Biscuit — $2 off"],
      ["Denny's",            12, ["commuter",        "suburban",        "family"],           "2 can dine for $14 — Denny's app"],
      ["IHOP",               13, ["family",          "suburban",        "morning"],          "Free short stack on your birthday — IHOP"],
      ["Olive Garden",       16, ["family",          "suburban",        "celebration"],      "Never-ending pasta — $14.99 today only"],
      ["Sweetgreen",         22, ["millennial",      "health_conscious","urban"],            "New salad drop — $2 off with app order"],
    ],
  },

  // ── Automotive (26) ─────────────────────────────────────────────────────────
  {
    prefix: "aut",
    sector: "Automotive",
    conversionType: "Lead_Gen",
    multipliers: { rain: 1.1, lowBattery: 1.2, weekend: 1.3 },
    brands: [
      ["Ford",               34, ["truck_buyer",     "american",        "suburban"],         "Test drive the F-150 Lightning — $0 down"],
      ["Chevrolet",          30, ["truck_buyer",     "american",        "suburban"],         "Test drive the Silverado EV today"],
      ["Toyota",             32, ["family",          "commuter",        "reliable"],         "Toyota RAV4 Hybrid — schedule a drive"],
      ["Honda",              28, ["family",          "commuter",        "reliable"],         "Honda Accord — 0% APR for 60 months"],
      ["Hyundai",            26, ["value_seeker",    "tech_enthusiast", "commuter"],         "Hyundai IONIQ 6 — test drive today"],
      ["Kia",                24, ["value_seeker",    "young_professional","commuter"],       "Kia EV6 — $7,500 federal tax credit"],
      ["Volkswagen",         28, ["commuter",        "european",        "design_conscious"], "VW ID.4 — 2 years free public charging"],
      ["Subaru",             26, ["outdoor_enthusiast","family",        "all_wheel_drive"],  "Subaru Forester — Symmetrical AWD"],
      ["Lexus",              52, ["high_net_worth",  "affluent",        "commuter"],         "Lexus RX 500h — request a test drive"],
      ["Acura",              42, ["high_net_worth",  "performance",     "commuter"],         "Acura ZDX — complimentary test drive"],
      ["Infiniti",           44, ["high_net_worth",  "luxury_buyer",    "commuter"],         "INFINITI QX60 — complimentary test drive"],
      ["Lincoln",            48, ["high_net_worth",  "affluent",        "comfort_seeker"],   "Lincoln Nautilus — Black Label test drive"],
      ["Cadillac",           50, ["high_net_worth",  "american_luxury", "affluent"],         "Cadillac LYRIQ — premium electric SUV"],
      ["Jeep",               32, ["outdoor_enthusiast","adventure",     "family"],           "Jeep Wrangler 4xe — plug-in hybrid"],
      ["Ram Trucks",         28, ["truck_buyer",     "american",        "suburban"],         "Ram 1500 REV — electric pickup truck"],
      ["CarMax",             22, ["car_buyer",       "value_seeker",    "commuter"],         "No-haggle used cars — search CarMax now"],
      ["Carvana",            20, ["car_buyer",       "tech_enthusiast", "online_native"],    "Buy a car online — 7-day money-back"],
      ["Goodyear",           18, ["commuter",        "family",          "suburban"],         "Buy 3 tires, get 1 free — Goodyear"],
      ["Bridgestone",        20, ["commuter",        "performance",     "family"],           "$70 off a set of 4 Bridgestone tires"],
      ["Pep Boys",           14, ["commuter",        "diy",             "suburban"],         "$30 off any service over $100 — Pep Boys"],
      ["AutoNation",         20, ["car_buyer",       "suburban",        "family"],           "AutoNation — certified pre-owned deals"],
      ["Firestone",          15, ["commuter",        "family",          "suburban"],         "Free tire rotation with any oil change"],
      ["Jiffy Lube",         14, ["commuter",        "convenience",     "suburban"],         "$10 off your next oil change — Jiffy Lube"],
      ["CARFAX",             18, ["car_buyer",       "research_driven", "commuter"],         "Free CARFAX report — know before you buy"],
      ["TrueCar",            20, ["car_buyer",       "value_seeker",    "online_native"],    "See what others paid — TrueCar pricing"],
      ["Rivian",             32, ["outdoor_enthusiast","eco_conscious",  "adventure"],        "Rivian R2 — reserve yours today"],
    ],
  },

  // ── Grocery (22) ────────────────────────────────────────────────────────────
  {
    prefix: "groc",
    sector: "Grocery",
    conversionType: "QR_Discount",
    multipliers: { rain: 1.2, lowBattery: 1.4, weekend: 1.3 },
    brands: [
      ["Whole Foods",        22, ["health_conscious","affluent",        "urban"],            "$10 off your $50 Whole Foods order"],
      ["Trader Joe's",       20, ["health_conscious","millennial",      "urban"],            "New arrivals this week — Trader Joe's"],
      ["Kroger",             18, ["family",          "value_seeker",    "suburban"],         "Kroger digital coupons — save $20 today"],
      ["Publix",             20, ["family",          "suburban",        "southern"],         "Buy one get one free — Publix weekly ad"],
      ["H-E-B",              20, ["family",          "suburban",        "texas"],            "H-E-B curbside — free first delivery"],
      ["Aldi",               16, ["value_seeker",    "family",          "suburban"],         "ALDI Finds — new deals every Wednesday"],
      ["Costco",             22, ["family",          "bulk_buyer",      "suburban"],         "Join Costco — $30 back on membership"],
      ["Sprouts",            20, ["health_conscious","suburban",        "family"],           "Weekly sale — 20% off organic produce"],
      ["Thrive Market",      22, ["health_conscious","online_native",   "eco_conscious"],    "Free 30-day trial — Thrive Market"],
      ["FreshDirect",        20, ["urban",           "convenience",     "commuter"],         "Free delivery on your first 3 orders"],
      ["Sam's Club",         18, ["family",          "bulk_buyer",      "suburban"],         "Save on membership — $20 instant savings"],
      ["Meijer",             16, ["family",          "suburban",        "value_seeker"],     "mPerks digital deals — save big this week"],
      ["Albertsons",         16, ["family",          "suburban",        "commuter"],         "Club card deals — download the app"],
      ["Safeway",            16, ["family",          "suburban",        "commuter"],         "Just for U deals — save $15 this week"],
      ["Giant Food",         15, ["family",          "suburban",        "value_seeker"],     "Giant loyalty card — earn 5× points"],
      ["Food Lion",          14, ["family",          "suburban",        "value_seeker"],     "MVP card — extra savings every week"],
      ["Winn-Dixie",         14, ["family",          "southern",        "value_seeker"],     "SE Grocers weekly ad — big savings"],
      ["Stop & Shop",        15, ["family",          "northeast",       "commuter"],         "GO Rewards — earn points on every visit"],
      ["Harris Teeter",      18, ["health_conscious","suburban",        "affluent"],         "VIC card savings — download the app"],
      ["Natural Grocers",    18, ["health_conscious","eco_conscious",   "suburban"],         "Free Health Coach consultation — in store"],
      ["Instacart",          24, ["convenience",     "urban",           "commuter"],         "Free delivery on your first Instacart order"],
      ["Walmart Grocery",    18, ["family",          "value_seeker",    "suburban"],         "$10 off your first Walmart+ grocery order"],
      ["Wegmans",            20, ["family",          "suburban",        "health_conscious"], "Wegmans app — digital coupons, easy ordering"],
      ["Amazon Fresh",       22, ["convenience",     "online_native",   "commuter"],         "Amazon Fresh — free delivery for Prime members"],
      ["BJ's Wholesale",     18, ["family",          "bulk_buyer",      "suburban"],         "BJ's Club — $25 off membership today"],
    ],
  },

  // ── Tech (26) ───────────────────────────────────────────────────────────────
  {
    prefix: "tec",
    sector: "Tech",
    conversionType: "App_Install",
    multipliers: { rain: 1.1, lowBattery: 1.2, weekend: 1.1 },
    brands: [
      ["Apple",              52, ["high_net_worth",  "tech_enthusiast", "affluent"],         "Download the Apple Store app for exclusive deals"],
      ["Samsung",            44, ["tech_enthusiast", "affluent",        "commuter"],         "Galaxy AI — download Samsung Members app"],
      ["Google",             48, ["tech_enthusiast", "commuter",        "millennial"],       "Google One — 2TB storage from $9.99/month"],
      ["Microsoft",          45, ["corporate",       "tech_professional","commuter"],        "Microsoft 365 — install on up to 6 devices"],
      ["Amazon",             38, ["online_native",   "shopper",         "commuter"],         "Amazon Prime — free 30-day trial"],
      ["Sony",               36, ["gamer",           "audiophile",      "tech_enthusiast"],  "PlayStation App — your gaming life, mobile"],
      ["LG",                 30, ["homeowner",       "tech_enthusiast", "family"],           "LG ThinQ app — control your home, anywhere"],
      ["Dell",               28, ["corporate",       "tech_professional","commuter"],        "Dell.com — configure your PC, ship in 5 days"],
      ["Best Buy",           26, ["tech_enthusiast", "shopper",         "suburban"],         "Best Buy app — exclusive app-only deals"],
      ["Adobe",              40, ["creative",        "tech_professional","millennial"],      "Adobe Creative Cloud — first month free"],
      ["Salesforce",         48, ["corporate",       "b2b",             "entrepreneur"],     "Salesforce Starter — free 30-day trial"],
      ["Zoom",               34, ["corporate",       "remote_worker",   "commuter"],         "Zoom Workplace — free for teams up to 40 min"],
      ["Slack",              36, ["corporate",       "tech_professional","urban"],           "Slack Pro — 50% off for 12 months"],
      ["Dropbox",            28, ["remote_worker",   "tech_professional","commuter"],        "Dropbox Plus — 2TB, save 20% with annual"],
      ["GitHub",             40, ["tech_professional","developer",      "urban"],            "GitHub Copilot — free for verified students"],
      ["Canva",              28, ["creative",        "small_business",  "millennial"],       "Canva Pro — free 45-day trial"],
      ["Notion",             30, ["tech_professional","remote_worker",  "millennial"],       "Notion AI — add to your workspace free"],
      ["HubSpot",            36, ["entrepreneur",    "small_business",  "b2b"],              "HubSpot CRM — free forever plan"],
      ["Shopify",            38, ["entrepreneur",    "small_business",  "online_native"],    "Shopify — $1/month for 3 months"],
      ["Monday.com",         32, ["corporate",       "b2b",             "remote_worker"],    "Monday.com — free 14-day trial for teams"],
      ["Figma",              34, ["creative",        "tech_professional","designer"],        "Figma Professional — free for students"],
      ["Twilio",             36, ["developer",       "b2b",             "tech_professional"],"Twilio — $10 free credits to get started"],
      ["Cloudflare",         38, ["developer",       "b2b",             "tech_professional"],"Cloudflare Zero Trust — free up to 50 users"],
      ["Vercel",             32, ["developer",       "tech_professional","startup"],         "Deploy in seconds — Vercel Pro 14-day free trial"],
      ["Netflix",            30, ["millennial",      "commuter",        "family"],           "Download Netflix — watch offline on the go"],
      ["Spotify",            26, ["commuter",        "millennial",      "urban"],            "Spotify Premium — 3 months for $0.99"],
      ["Discord",            22, ["gamer",           "millennial",      "tech_enthusiast"],  "Discord Nitro — boost your server today"],
      ["Grammarly",          28, ["professional",    "remote_worker",   "tech_professional"],"Grammarly Premium — write with confidence"],
      ["Duolingo",           20, ["millennial",      "traveler",        "young_professional"],"Duolingo Plus — learn a language ad-free"],
      ["Asana",              34, ["corporate",       "b2b",             "remote_worker"],    "Asana — manage projects free for teams"],
      ["Zapier",             36, ["entrepreneur",    "tech_professional","b2b"],             "Automate your workflows — Zapier free tier"],
    ],
  },
];

// ─── Generator ────────────────────────────────────────────────────────────────

function generateAdBank(): Ad[] {
  const ads: Ad[] = [];

  for (const def of SECTORS) {
    def.brands.forEach(([brand, baseCpm, affinities, conversionValue], idx) => {
      const id = `${def.prefix}-${String(idx + 1).padStart(4, "0")}`;
      const brandSlug = slug(brand);
      ads.push({
        id,
        brand,
        sector: def.sector,
        baseCpm,
        bidMultipliers: { ...def.multipliers },
        conversion: { type: def.conversionType, value: conversionValue },
        qrCodeUrl: `${QR_BASE}${id}`,
        targetAffinities: [...affinities],
        videoUrl: `${S3}/placeholder_${brandSlug}.mp4`,
      });
    });
  }

  return ads;
}

export const AD_BANK: Ad[] = generateAdBank();

// Re-export Ad type explicitly for consumers
export type { Ad as GeneratedAd };
