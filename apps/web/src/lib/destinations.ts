/**
 * Semilla histórica SECTUR (16-03-2015), consultada el 15-10-2026:
 * https://www.gob.mx/sectur/acciones-y-programas/44-destinos-turisticos-prioritarios
 * 44 destinos, no necesariamente ciudades/municipios individuales: las entradas
 * compuestas se conservan como un destino. Se conserva Distrito Federal (2015),
 * México y Nuevo Vallarta; no se actualizan nombres ni se añaden destinos.
 * Erratas corregidas: Chiahuahua → Chihuahua, Quinatana Roo → Quintana Roo;
 * S.L.P. se expande a San Luis Potosí y «de Los» se escribe «de los».
 */
export const DESTINATIONS_BY_STATE = {
  Aguascalientes: ['Aguascalientes'],
  'Baja California': ['Ensenada', 'Tijuana'],
  'Baja California Sur': ['Los Cabos'],
  Campeche: ['Campeche'],
  Chiapas: ['Tuxtla Gutiérrez'],
  Chihuahua: ['Ciudad Juárez'],
  Coahuila: ['Torreón'],
  Colima: ['Manzanillo'],
  'Distrito Federal': ['Ciudad de México'],
  Durango: ['Durango'],
  Guanajuato: ['Guanajuato', 'León', 'San Miguel de Allende'],
  Guerrero: ['Acapulco', 'Ixtapa, Zihuatanejo'],
  Hidalgo: ['Pachuca'],
  Jalisco: ['Guadalajara', 'Puerto Vallarta', 'San Juan de los Lagos'],
  México: ['Chalma', 'Ixtapan de la Sal'],
  Michoacán: ['Morelia'],
  Morelos: ['Cuernavaca'],
  Nayarit: ['Nuevo Vallarta'],
  'Nuevo León': ['Monterrey'],
  Oaxaca: ['Huatulco', 'Oaxaca'],
  Puebla: ['Puebla'],
  Querétaro: ['Querétaro'],
  'Quintana Roo': ['Cancún', 'Cozumel', 'Riviera Maya'],
  'San Luis Potosí': ['San Luis Potosí'],
  Sinaloa: ['Mazatlán'],
  Sonora: ['Hermosillo'],
  Tabasco: ['Villahermosa'],
  Tamaulipas: ['Tampico, Madero'],
  Tlaxcala: ['Tlaxcala'],
  Veracruz: ['Tlacotalpan', 'Veracruz, Boca del Río', 'Xalapa'],
  Yucatán: ['Mérida'],
  Zacatecas: ['Zacatecas'],
} as const satisfies Readonly<Record<string, readonly string[]>>;

export type DestinationState = keyof typeof DESTINATIONS_BY_STATE;
export type DestinationCity<S extends DestinationState = DestinationState> =
  (typeof DESTINATIONS_BY_STATE)[S][number];

/**
 * Formato futuro propuesto (todavía NO persistido): { state, city }.
 * Unión discriminada: cada estado admite solo sus destinos, sin separar por
 * comas los destinos compuestos. No es un id ni modifica Property.city legacy.
 */
export type DestinationValue = {
  [S in DestinationState]: Readonly<{ state: S; city: DestinationCity<S> }>
}[DestinationState];

/** Orden de entidades de la fuente, no orden alfabético de UI. */
export const DESTINATION_STATES: readonly DestinationState[] = Object.keys(DESTINATIONS_BY_STATE) as DestinationState[];

export function citiesByState<S extends DestinationState>(state: S): (typeof DESTINATIONS_BY_STATE)[S] {
  return DESTINATIONS_BY_STATE[state];
}

/** Comparación de texto, NO matching geográfico ni transformación de datos.
 * Conserva tildes, comas y espacios internos; NFC iguala Unicode compuesto.
 * No elimina estados pegados a city ni inventa equivalencias entre lugares.
 */
export function normalizeDestination(value: string): string {
  return value.trim().normalize('NFC').toLocaleLowerCase('es-MX');
}

/** Par persistido propuesto: city ya es legacy en Property. */
export type PropertyDestinationValue = {
  [S in DestinationState]: Readonly<{ state: S; destinationCity: DestinationCity<S> }>
}[DestinationState];

export function isDestinationValue(value: { state?: unknown; destinationCity?: unknown }): value is PropertyDestinationValue {
  return typeof value.state === 'string' && Object.hasOwn(DESTINATIONS_BY_STATE, value.state)
    && typeof value.destinationCity === 'string'
    && (citiesByState(value.state as DestinationState) as readonly string[]).includes(value.destinationCity);
}

/** Nuevos campos primero; legacy se conserva para propiedades aún no migradas. */
export function propertyLocation(value: { state?: string | null; destinationCity?: string | null; city?: string | null }): string {
  return isDestinationValue(value) ? `${value.destinationCity}, ${value.state}` : value.city?.trim() || '';
}
