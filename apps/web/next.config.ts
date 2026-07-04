import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "node:path";

// Env lives at the monorepo root.
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@paperclip/db", "@paperclip/core"],
};

export default nextConfig;
