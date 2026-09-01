import type { NextConfig } from "next";
import { withNextAriaDevkit } from "next-aria-devkit/plugin";

const nextConfig: NextConfig = {};

export default withNextAriaDevkit(nextConfig, {
  bridgeUrl: "/api/next-devkit",
});
