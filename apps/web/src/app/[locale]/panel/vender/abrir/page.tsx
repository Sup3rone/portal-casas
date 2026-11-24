// T-5210: paso «Modo usuario → Modo vendedor» desde la ficha pública (/casas/<slug>). Traduce slug → id SOLO si la
// casa la gestiona quien entra; si no, va a la búsqueda del vendedor con las mismas fechas (no revela ids ajenos).
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, properties } from '@portal/db';
import { panelManager } from '@/lib/panel-server';
import { managedProperties } from '@/lib/property-access';

type Query = Record<string, string | string[] | undefined>;
const STAY = /^[0-9-]{1,10}$/;

export default async function OpenAsVendor({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Query> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  const query = await searchParams ?? {};
  const stay = new URLSearchParams();
  for (const key of ['start', 'end', 'guests']) {
    const value = query[key];
    if (typeof value === 'string' && STAY.test(value)) stay.set(key, value);
  }
  const suffix = stay.toString() ? '?' + stay : '';
  const slug = typeof query.slug === 'string' ? query.slug : '';
  const [property] = slug ? await db.select({ id: properties.id }).from(properties)
    .where(and(eq(properties.slug, slug), managedProperties(manager))).limit(1) : [];
  redirect(property ? `/${locale}/panel/vender/${encodeURIComponent(property.id)}${suffix}` : `/${locale}/panel/vender${suffix}`);
}
