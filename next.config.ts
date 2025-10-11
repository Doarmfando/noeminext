import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Advertencia: Esto permite que el build se complete aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mantener la verificación de TypeScript durante el build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
