import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const connectionString = process.env.DATABASE_URL || "file:./dev.db";

function createPrismaClient(): PrismaClient {
  try {
    const adapter = new PrismaLibSql({
      url: connectionString,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  } catch {
    // Fallback: no adapter (will fail gracefully at query time)
    return new PrismaClient();
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
