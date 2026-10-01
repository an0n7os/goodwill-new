import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // `env("DATABASE_URL")` throws when the variable is missing (e.g. on Netlify builds),
    // so read process.env directly and fall back to the local SQLite file.
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  migrations: {
    path: "prisma/migrations",
  },
});
