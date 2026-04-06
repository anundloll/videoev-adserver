// ─── /data/api/vehicles (proxied as /api/vehicles on data.videoev.com) ───────
// OCPP ingest endpoint — receives vehicle telemetry from charging station
// hardware when a vehicle plugs in. Creates a VehicleProfile row per session.
//
// POST /api/vehicles          — real OCPP webhook (one profile per session)
// POST /api/vehicles?seed=1   — demo seed (generates 40 realistic profiles)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Demo seed data ───────────────────────────────────────────────────────────

const DEMO_MAKES = [
  { make: "Tesla",   models: ["Model 3", "Model Y", "Model S"], msrpRange: [42000, 135000] },
  { make: "BMW",     models: ["i4", "iX", "i7"],                msrpRange: [66000, 120000] },
  { make: "Porsche", models: ["Taycan", "Taycan Cross Turismo"], msrpRange: [90000, 195000] },
  { make: "Rivian",  models: ["R1T", "R1S"],                    msrpRange: [68000, 95000]  },
  { make: "Lucid",   models: ["Air Pure", "Air Grand Touring"], msrpRange: [70000, 155000] },
  { make: "Genesis", models: ["GV60", "GV70e"],                 msrpRange: [55000, 78000]  },
  { make: "Volvo",   models: ["XC40 Recharge", "C40"],          msrpRange: [54000, 70000]  },
  { make: "Audi",    models: ["Q4 e-tron", "e-tron GT"],        msrpRange: [52000, 108000] },
  { make: "Hyundai", models: ["IONIQ 5", "IONIQ 6"],            msrpRange: [41000, 58000]  },
  { make: "Ford",    models: ["Mustang Mach-E", "F-150 Lightning"], msrpRange: [44000, 96000] },
];

const VENUES = ["luxury_retail", "airport", "mall", "highway", "hotel", "office_park"];

function randBetween(a: number, b: number) {
  return Math.round(a + Math.random() * (b - a));
}

function randFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ── Demo seed mode ────────────────────────────────────────────────────────
  if (searchParams.get("seed") === "1") {
    const existing = await prisma.vehicleProfile.count();
    if (existing >= 20) {
      return NextResponse.json({ message: "Seed data already present", count: existing });
    }

    const profiles = Array.from({ length: 40 }, () => {
      const car    = randFrom(DEMO_MAKES);
      const model  = randFrom(car.models);
      const msrp   = randBetween(car.msrpRange[0], car.msrpRange[1]);
      const daysAgo = randBetween(0, 29);
      const det    = new Date(Date.now() - daysAgo * 86_400_000 - randBetween(0, 43_200_000));
      return {
        sessionId:    `seed-${crypto.randomUUID()}`,
        make:         car.make,
        model,
        year:         randFrom([2022, 2023, 2024, 2024]),
        msrp,
        batteryPct:   randBetween(8, 45),
        chargeKwh:    randBetween(12, 60),
        dwellMinutes: randBetween(14, 55),
        venue:        randFrom(VENUES),
        detectedAt:   det,
      };
    });

    await prisma.vehicleProfile.createMany({ data: profiles, skipDuplicates: true });
    return NextResponse.json({ message: "Seeded", count: profiles.length }, { status: 201 });
  }

  // ── Real OCPP ingest ──────────────────────────────────────────────────────
  let body: {
    sessionId:    string;
    make:         string;
    model?:       string;
    year?:        number;
    msrp?:        number;
    batteryPct?:  number;
    chargeKwh?:   number;
    dwellMinutes?: number;
    venue?:       string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sessionId || !body.make) {
    return NextResponse.json({ error: "sessionId and make are required" }, { status: 422 });
  }

  try {
    const profile = await prisma.vehicleProfile.upsert({
      where:  { sessionId: body.sessionId },
      update: {
        dwellMinutes: body.dwellMinutes,
        chargeKwh:    body.chargeKwh,
        batteryPct:   body.batteryPct,
      },
      create: {
        sessionId:    body.sessionId,
        make:         body.make,
        model:        body.model,
        year:         body.year,
        msrp:         body.msrp,
        batteryPct:   body.batteryPct,
        chargeKwh:    body.chargeKwh,
        dwellMinutes: body.dwellMinutes,
        venue:        body.venue,
      },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error("[data/api/vehicles] POST failed:", err);
    return NextResponse.json({ error: "Failed to record vehicle profile" }, { status: 500 });
  }
}
