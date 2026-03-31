import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Singleton pattern ────────────────────────────────────────────────────────
// In development, Next.js hot-reloads modules which would otherwise create a
// new PrismaClient instance on every reload and exhaust the connection pool.
// Caching the client on the global object prevents this.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[Prisma] DATABASE_URL is not set — queries will fail at runtime.");
  }
  const adapter = new PrismaPg({ connectionString: connectionString ?? "" });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
