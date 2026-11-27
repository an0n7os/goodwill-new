import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";
import ws from "ws";

// Node runtimes without a global WebSocket need the ws package for the Neon driver.
if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

function getRuntimeDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const ctx = getCloudflareContext();
    const envUrl = (ctx?.env as { DATABASE_URL?: string } | undefined)?.DATABASE_URL;
    if (envUrl) return envUrl;
  } catch {
    // Not inside a Cloudflare request context (e.g. during Next.js build or local scripts)
  }
  return "";
}

function createPrismaClient(connectionString: string): PrismaClient {
  // During CI builds without build-time DATABASE_URL, use a placeholder Neon URL
  // so PrismaClient initializes cleanly for provider="postgresql" without throwing synchronously.
  const effectiveUrl =
    connectionString && connectionString.startsWith("postgres")
      ? connectionString
      : "postgresql://build:build@localhost.neon.tech/neondb?sslmode=require";

  if (effectiveUrl.includes("neon.tech")) {
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: effectiveUrl }),
    });
  }

  const pool = new Pool({
    connectionString: effectiveUrl,
    ssl: effectiveUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

function resolveDb(): PrismaClient {
  const url = getRuntimeDatabaseUrl();
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== url) {
    globalForPrisma.prisma = createPrismaClient(url);
    globalForPrisma.prismaUrl = url;
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
