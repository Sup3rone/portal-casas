import { getLocale, getTranslations } from 'next-intl/server';
import PropertyShareButton from './PropertyShareButton';
import Reveal from './Reveal';

type Props = {
  lat: number;
  lng: number;
  address: string;
  propertyTitle: string;
};

export default async function LocationMap({ lat, lng, address, propertyTitle }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('details');
  return (
    <Reveal className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <PropertyShareButton title={propertyTitle} />
      <iframe
        title={t('mapTitle', { address })}
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=${locale}&output=embed`}
        className="aspect-square w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {/* Overlay de dirección abajo, estilo tarjeta */}
      <div className="bg-white dark:bg-gray-900 px-4 py-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">📍 {address}</p>
      </div>
    </Reveal>
  );
}
