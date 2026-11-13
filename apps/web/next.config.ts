import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Metadata en el head del HTML inicial también para navegadores normales.
  htmlLimitedBots: /.*/,
  // T-4829: optimizar las fotos públicas de Vercel Blob (tamaño por pantalla + WebP). Ver lib/image-src.ts.
  // Las subidas tienen nombre único, por eso la caché larga (31 días) es segura y ahorra transformaciones.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/**', search: '' }],
    qualities: [75],
    minimumCacheTTL: 2_678_400,
  },
  outputFileTracingIncludes: {
    '/**/*': [
      './../../packages/db/src/generated/**/*'
    ]
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
