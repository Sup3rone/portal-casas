import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: '../../',
    outputFileTracingInclude: ['../../packages/db/src/generated/**']
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
