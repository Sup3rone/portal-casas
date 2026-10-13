'use client';

import { Analytics } from '@vercel/analytics/next';
import { track } from '@vercel/analytics';
import type { AnchorHTMLAttributes } from 'react';

export default function SiteAnalytics() {
  return <Analytics beforeSend={event => {
    // Las URLs pueden contener tokens de recuperación o parámetros personales.
    const url = new URL(event.url);
    url.search = ''; url.hash = '';
    return { ...event, url: url.toString() };
  }} />;
}

export function PropertyWhatsAppLink({ propertySlug, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { propertySlug: string }) {
  return <a {...props} onClick={() => {
    // Un fallo de telemetría nunca debe impedir abrir el chat.
    try { track('whatsapp_clicked', { property: propertySlug }); } catch { /* Analytics opcional. */ }
  }} />;
}
