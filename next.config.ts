import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  distDir: process.env.GOODWILL_BUILD_DIR || '.next',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { isServer }) => {
    if (isServer && process.env.OPENNEXT_INNER_BUILD === "1") {
      const prismaEdgeEntry = path.resolve(process.cwd(), "src/generated/prisma/edge.js");
      config.externals = config.externals || [];
      config.externals.push(
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request === "@/generated/prisma") {
            return callback(null, `commonjs ${prismaEdgeEntry}`);
          }
          callback();
        }
      );
    }
    return config;
  },
};

export default nextConfig;
