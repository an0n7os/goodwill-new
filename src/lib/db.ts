import { PrismaClient } from "@/generated/prisma";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { neonConfig } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";
import ws from "ws";

// Node runtimes without a global WebSocket need the ws package for the Neon driver.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

const d1ClientCache = new WeakMap<object, PrismaClient>();

function getCloudflareD1Client(): PrismaClient | null {
  try {
    const ctx = getCloudflareContext();
    const d1 = (ctx?.env as { DB?: ConstructorParameters<typeof PrismaD1>[0] } | undefined)?.DB;
    if (!d1) return null;
    const cached = d1ClientCache.get(d1);
    if (cached) return cached;
    const client = new PrismaClient({ adapter: new PrismaD1(d1) });
    d1ClientCache.set(d1, client);
    return client;
  } catch {
    return null;
  }
}

function createFallbackPrismaClient(): PrismaClient {
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

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDb(): PrismaClient {
  const d1Client = getCloudflareD1Client();
  if (d1Client) return d1Client;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createFallbackPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolveDb();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
