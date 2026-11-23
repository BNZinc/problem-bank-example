import type { NextConfig } from "next";

// web/ is its own project next to the server: pin the root here so Next does not climb to the
// server's lockfile one folder up.
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
};

export default config;
