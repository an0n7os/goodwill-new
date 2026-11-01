import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";
import ws from "ws";

import { PrismaLibSql } from "@prisma/adapter-libsql";

// Node runtimes without a global WebSocket need the ws package for the Neon driver.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || "file:./dev.db";

  // SQLite / LibSQL (local dev.db or Turso)
  if (connectionString.startsWith("file:") || connectionString.startsWith("libsql:") || !connectionString.startsWith("postgres")) {
    const adapter = new PrismaLibSql({
      url: connectionString.startsWith("file:") || connectionString.startsWith("libsql:") ? connectionString : "file:./dev.db",
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
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

globalForPrisma.prisma = db;
