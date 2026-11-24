// T-5210: paso «Modo vendedor → Modo usuario» desde la ficha o la cotización del vendedor. Traduce id → slug de una
// casa que gestiona (ajena → 404 por panelProperty). Publicada → su ficha pública; borrador → la portada.
import { redirect } from 'next/navigation';
import { panelProperty } from '@/lib/panel-server';

type Query = Record<string, string | string[] | undefined>;
const STAY = /^[0-9-]{1,10}$/;

export default async function OpenAsUser({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams?: Promise<Query> }) {
  const { locale, id } = await params;
  const { property } = await panelProperty(id, locale);
  if (!property.published) redirect(`/${locale}`);
  const query = await searchParams ?? {};
  const stay = new URLSearchParams();
  for (const key of ['start', 'end', 'guests']) {
    const value = query[key];
    if (typeof value === 'string' && STAY.test(value)) stay.set(key, value);
  }
  redirect(`/${locale}/casas/${encodeURIComponent(property.slug)}${stay.toString() ? '?' + stay : ''}`);
}
