import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* tu config normal aquí si algún día la necesitas */
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
