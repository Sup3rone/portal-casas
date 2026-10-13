import { handlers } from "@/lib/auth";
import { NextRequest } from 'next/server';
import { consumeRateLimit, rateLimitLocale, rateLimitResponse } from '@/lib/rate-limit';

export const { GET } = handlers;
export async function POST(request: NextRequest) {
  if (new URL(request.url).pathname.endsWith('/callback/credentials')) {
    const retry = consumeRateLimit('login', request.headers);
    if (retry) return rateLimitResponse(retry, rateLimitLocale(request.headers));
  }
  return handlers.POST(request);
}
