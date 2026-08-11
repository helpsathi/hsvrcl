import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return empty client if no URL is provided, to avoid crash on build
    return new PrismaClient();
  }

  // If pool already exists in global scope during dev hot-reloads, reuse it
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 20 : 10,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 25000, // 25s gives generous room for Neon serverless cold starts
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: false,
    });

  // Attach silent pool error handler to prevent unhandled idle client drop crashes
  pool.on("error", (err) => {
    console.warn("Neon PostgreSQL pool client connection/idle error:", err?.message || err);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const DEFAULT_TRANSACTION_OPTIONS = {
  maxWait: 15000, // 15s to acquire a connection during Neon cold start
  timeout: 30000, // 30s to execute multi-table transaction operations
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
