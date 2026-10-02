import { getLocale, getTranslations } from 'next-intl/server';

type Props = {
  lat: number;
  lng: number;
  address: string;
};

export default async function LocationMap({ lat, lng, address }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('details');
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <iframe
        title={t('mapTitle', { address })}
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=${locale}&output=embed`}
        className="aspect-square w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {/* Overlay de dirección abajo, estilo tarjeta */}
      <div className="bg-white px-4 py-3">
        <p className="text-sm font-semibold text-gray-800">📍 {address}</p>
      </div>
    </div>
  );
}
