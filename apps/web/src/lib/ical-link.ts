// T-4739: utilidades puras del enlace iCal (cliente y servidor).
// El .ics de Airbnb NO trae el nombre del anuncio (verificado 10-11-2026: sin X-WR-CALNAME; solo eventos
// «Airbnb (Not available)»). Lo único identificable es el número de anuncio en la URL:
//   https://www.airbnb.mx/calendar/ical/1815594682034301913.ics?t=…  → 1815594682034301913
export function airbnbListingId(value: string) {
  try {
    const url = new URL(value.trim().replace(/^webcal:\/\//i, 'https://'));
    if (!/(^|\.)airbnb\.[a-z.]+$/i.test(url.hostname)) return null;
    return /^\/calendar\/ical\/(\d{3,25})\.ics$/.exec(url.pathname)?.[1] ?? null;
  } catch { return null; }
}

/** Título provisional cuando el calendario no trae nombre (editable antes de guardar). */
export const provisionalTitle = (listingId: string) => `Airbnb · anuncio ${listingId}`;
