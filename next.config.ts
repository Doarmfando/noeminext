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

  // Optimizaciones de compilación
  compiler: {
    // Remover console.log en producción para reducir bundle size
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Mantener console.error y console.warn
    } : false,
  },

  // Optimización de imports de paquetes grandes
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
    ],
  },

  // Headers de caché para assets estáticos
  async headers() {
    return [
      {
        // Cachear imágenes estáticas por 1 año
        source: '/opengraph-image.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/twitter-image.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
