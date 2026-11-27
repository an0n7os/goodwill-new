import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon, PrismaNeonHttp } from "@prisma/adapter-neon";
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

function getEffectiveUrl(connectionString: string): string {
  return connectionString && connectionString.startsWith("postgres")
    ? connectionString
    : "postgresql://build:build@localhost.neon.tech/neondb?sslmode=require";
}

function createHttpOrPgClient(effectiveUrl: string): PrismaClient {
  if (effectiveUrl.includes("neon.tech")) {
    // Stateless HTTP fetch adapter: avoids Cloudflare Workers cross-request WebSocket I/O errors
    return new PrismaClient({
      adapter: new PrismaNeonHttp(effectiveUrl, {}),
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

function resolveDb(): { client: PrismaClient; url: string } {
  const url = getEffectiveUrl(getRuntimeDatabaseUrl());
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== url) {
    globalForPrisma.prisma = createHttpOrPgClient(url);
    globalForPrisma.prismaUrl = url;
  }
  return { client: globalForPrisma.prisma, url };
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const { client, url } = resolveDb();
    if (prop === "$transaction" && url.includes("neon.tech")) {
      return async (...args: Parameters<PrismaClient["$transaction"]>) => {
        const txClient = new PrismaClient({
          adapter: new PrismaNeon({ connectionString: url }),
        });
        try {
          return await (txClient.$transaction as (...a: unknown[]) => Promise<unknown>)(...args);
        } finally {
          await txClient.$disconnect().catch(() => {});
        }
      };
    }
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
