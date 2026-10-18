import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Migrations / db push use Neon's direct (non-pooled) connection; the app uses the pooled DATABASE_URL.
    // process.env (not env()) so builds without a database, e.g. Netlify previews, don't throw.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
  migrations: {
    path: "prisma/migrations",
  },
});
