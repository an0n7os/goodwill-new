import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon Postgres. DATABASE_URL is the pooled connection string ("-pooler" host).
// Node runtimes without a global WebSocket need the ws package for the Neon driver.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.startsWith("postgres")) {
    // No database configured: queries fail and callers fall back to the catalogue snapshot
    console.warn("DATABASE_URL is not a Postgres connection string; database features are disabled.");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: connectionString || "postgresql://invalid/none" }) });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
