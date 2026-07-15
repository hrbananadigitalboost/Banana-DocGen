import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output ramping untuk image Docker (deploy ke Railway) - cuma file yang
  // benar-benar dipakai runtime yang di-copy, bukan seluruh node_modules/source.
  output: "standalone",
};

export default nextConfig;
