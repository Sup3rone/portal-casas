import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Metadata en el head del HTML inicial también para navegadores normales.
  htmlLimitedBots: /.*/,
  outputFileTracingIncludes: {
    '/**/*': [
      './../../packages/db/src/generated/**/*'
    ]
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
