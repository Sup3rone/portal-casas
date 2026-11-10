// T-4719: JSON-LD (schema.org VacationRental) de una ficha publicada.
// Regla: si un dato no existe, la propiedad se omite; nunca se inventa.
import { isDestinationValue } from '@/lib/destinations';
import { localizedUrl, siteUrl } from '@/lib/seo';

type JsonLdProperty = {
  slug: string; rentalType: string; address: string | null;
  state: string | null; destinationCity: string | null;
  lat: number | null; lng: number | null;
  maxGuests: number | null; bedrooms: number | null; bathrooms: number | null;
  baseWeekdayPrice: number | null; baseWeekendPrice: number | null;
};
type JsonLdMedia = { url: string; type: string; order: number; isCover: boolean; coverOrder: number | null };
type JsonLdRate = { startDate: string; endDate: string; weekdayPrice: number; weekendPrice: number };
/** Textos desde los diccionarios (seo.jsonLd.*), en el idioma de la página. */
export type JsonLdLabels = { weekday: string; weekend: string; perNight: string };

const MAX_IMAGES = 10;
const positive = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
const text = (value: string | null | undefined) => value?.trim().replace(/\s+/g, ' ') || undefined;
const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;

/** Fotos en el mismo orden que la imagen social: portadas por coverOrder y después el resto. */
function imageUrls(mediaList: JsonLdMedia[]) {
  const photos = mediaList.filter(item => item.type === 'PHOTO');
  const rank = (item: JsonLdMedia) => item.isCover ? (item.coverOrder ?? 0) : item.order;
  photos.sort((a, b) => Number(b.isCover) - Number(a.isCover) || rank(a) - rank(b));
  return [...new Set(photos.map(item => new URL(item.url, siteUrl()).toString()))].slice(0, MAX_IMAGES);
}

function nightPrice(price: number, name: string, labels: JsonLdLabels, period?: { validFrom: string; validThrough: string }) {
  return compact({ '@type': 'UnitPriceSpecification', name, price, priceCurrency: 'MXN', unitText: labels.perNight, ...period });
}

/** Tarifas por noche en MXN. Las rentas anuales no publican tarifa (contacto directo). */
function offers(property: JsonLdProperty, rates: JsonLdRate[], labels: JsonLdLabels, url: string) {
  if (property.rentalType === 'anual') return undefined;
  const specs = [
    ...(positive(property.baseWeekdayPrice) ? [nightPrice(property.baseWeekdayPrice, labels.weekday, labels)] : []),
    ...(positive(property.baseWeekendPrice) ? [nightPrice(property.baseWeekendPrice, labels.weekend, labels)] : []),
    ...rates.flatMap(rate => {
      const period = { validFrom: rate.startDate, validThrough: rate.endDate };
      return [
        ...(positive(rate.weekdayPrice) ? [nightPrice(rate.weekdayPrice, labels.weekday, labels, period)] : []),
        ...(positive(rate.weekendPrice) ? [nightPrice(rate.weekendPrice, labels.weekend, labels, period)] : []),
      ];
    }),
  ];
  return specs.length ? [{ '@type': 'Offer', url, priceCurrency: 'MXN', priceSpecification: specs }] : undefined;
}

export function propertyJsonLd({ property, locale, title, description, mediaList, rates, labels }: {
  property: JsonLdProperty; locale: string; title: string; description: string;
  mediaList: JsonLdMedia[]; rates: JsonLdRate[]; labels: JsonLdLabels;
}) {
  const url = localizedUrl(locale, `/casas/${encodeURIComponent(property.slug)}`);
  const catalog = isDestinationValue(property);
  const address = compact({
    '@type': 'PostalAddress',
    streetAddress: text(property.address),
    addressLocality: catalog ? property.destinationCity! : undefined,
    addressRegion: catalog ? property.state! : undefined,
    // El catálogo de destinos es mexicano (SECTUR): el país solo se afirma si el destino viene de él.
    addressCountry: catalog ? 'MX' : undefined,
  });
  const images = imageUrls(mediaList);
  const accommodation = compact({
    '@type': 'Accommodation',
    occupancy: positive(property.maxGuests) ? { '@type': 'QuantitativeValue', maxValue: property.maxGuests } : undefined,
    numberOfBedrooms: positive(property.bedrooms) ? property.bedrooms : undefined,
    // numberOfBathroomsTotal es entero en schema.org: un medio baño no se redondea.
    numberOfBathroomsTotal: positive(property.bathrooms) && Number.isInteger(property.bathrooms) ? property.bathrooms : undefined,
  });
  return compact({
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    '@id': url,
    url,
    inLanguage: locale,
    name: text(title),
    description: text(description),
    image: images.length ? images : undefined,
    address: Object.keys(address).length > 1 ? address : undefined,
    geo: property.lat != null && property.lng != null && Number.isFinite(property.lat) && Number.isFinite(property.lng)
      ? { '@type': 'GeoCoordinates', latitude: property.lat, longitude: property.lng } : undefined,
    containsPlace: Object.keys(accommodation).length > 1 ? accommodation : undefined,
    makesOffer: offers(property, rates, labels, url),
  });
}

/** Serializa para <script type="application/ld+json"> sin permitir cerrar la etiqueta. */
// '<' y los separadores de línea U+2028/U+2029 salen como escapes \uXXXX (el JSON sigue siendo válido).
const UNSAFE_IN_SCRIPT = new RegExp('[<' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
const BACKSLASH = String.fromCharCode(92);
export function jsonLdScript(value: unknown) {
  return JSON.stringify(value).replace(UNSAFE_IN_SCRIPT, char => BACKSLASH + 'u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
}
