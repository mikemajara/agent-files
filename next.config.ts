import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["duckdb", "files-sdk"],
};

export default withEve(nextConfig);
