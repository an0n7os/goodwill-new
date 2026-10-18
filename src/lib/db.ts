import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";
import ws from "ws";

// Node runtimes without a global WebSocket need the ws package for the Neon driver.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.startsWith("postgres")) {
    // No database configured: queries fail and callers fall back to the catalogue snapshot
    console.warn("DATABASE_URL is not a Postgres connection string; database features are disabled.");
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: "postgresql://invalid/none" }),
    });
  }

  // If using Neon serverless
  if (connectionString.includes("neon.tech")) {
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }

  // Standard PostgreSQL (Supabase, AWS RDS, self-hosted, etc.)
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
