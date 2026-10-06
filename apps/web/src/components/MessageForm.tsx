// apps/web/src/components/MessageForm.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useReservationDates } from './ReservationDatesProvider';
import { inquiryFields, inquiryFromFormData, inquiryToday, validateInquiry, type InquiryErrors, type InquiryField } from '@/lib/inquiry-validation';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations('details.form');
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-gray-900 hover:bg-gray-700 text-white font-light tracking-[0.25em] py-4 px-4 transition-colors disabled:opacity-50 uppercase"
    >
      {pending ? t('enviando') : t('enviar')}
    </button>
  );
}

// --- Tipos de pricing (datos de lectura que pasa la página) ---
export type PricingInfo = {
  base: { weekday: number | null; weekend: number | null };
  seasons: {
    start: string; end: string;
    weekday: number; weekend: number; priority: number;
  }[];
  booked: { start: string; end: string }[];
};

// --- Fecha -> "YYYY-MM-DD" en local (sin desfases UTC) ---
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}


// Cuenta noche por noche (checkout no se cobra)
function calcularCotizacion(startStr: string, endStr: string, pricing: PricingInfo) {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

  let total = 0;
  let noches = 0;
  let sinPrecio = false;
  let choque = false;

  for (let d = new Date(start); d < end; d = addDays(d, 1)) {
    noches++;
    const day = d.getDay();
    const esFinde = day === 0 || day === 6;
    const hoy = iso(d);

    if (pricing.booked.some(b => hoy >= b.start && hoy < b.end)) choque = true;

    const season = pricing.seasons
      .filter(s => hoy >= s.start && hoy <= s.end)
      .sort((a, b) => b.priority - a.priority)[0];

    const precio = season
      ? (esFinde ? season.weekend : season.weekday)
      : (esFinde ? pricing.base.weekend : pricing.base.weekday);

    if (precio == null) sinPrecio = true;
    else total += precio;
  }

  return { total: sinPrecio ? null : total, noches, choque };
}

export default function MessageForm({
  propertyId,
  locale,
  pricing,
  maxGuests,
  compact = false,
}: {
  propertyId: string;
  locale: string;
  pricing: PricingInfo;
  maxGuests: number;
  compact?: boolean;
}) {
  const t = useTranslations('details.form');
  const formatoLocale = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'es-MX';
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { dates: { startDate, endDate }, setDates } = useReservationDates();
  const [guests, setGuests] = useState<number>(1);
  const [fields, setFields] = useState({ name: '', email: '', phone: '', body: '' });
  const [serverValidation, setServerValidation] = useState<{ signature: string; errors: InquiryErrors; maxGuests?: number } | null>(null);
  const hoy = inquiryToday();
  const input = { ...fields, guests, startDate, endDate };
  const signature = JSON.stringify(input);
  const localErrors = validateInquiry(input, { today: hoy, maxGuests, bookings: pricing.booked.map(booking => ({ startDate: booking.start, endDate: booking.end })) });
  const serverErrors = serverValidation?.signature === signature ? serverValidation : null;
  const errors: InquiryErrors = { ...localErrors, ...serverErrors?.errors };
  function fieldError(field: InquiryField) {
    return errors[field] ? <p id={`${field}-error`} className="text-red-600 text-xs tracking-wide" aria-live="polite">
      {t(`validation.${errors[field]}`, { maxGuests: serverErrors?.maxGuests ?? maxGuests })}
    </p> : null;
  }

  const cotizacion = useMemo(
    () => startDate && endDate ? calcularCotizacion(startDate, endDate, pricing) : null,
    [startDate, endDate, pricing]
  );

  // En globals.css o directamente en el component:
  const formClasses = compact
    ? 'bg-white/90 backdrop-blur-md rounded-xl p-4'
    : '';

  async function handleSubmit(formData: FormData) {
    const submitted = inquiryFromFormData(formData);
    const checked = validateInquiry(submitted, { today: inquiryToday(), maxGuests, bookings: pricing.booked.map(booking => ({ startDate: booking.start, endDate: booking.end })) });
    if (Object.keys(checked).length) return;
    try {
      const res = await fetch('/api/messages', { method: 'POST', body: formData });
      if (res.status === 400) {
        const response = await res.json();
        const fieldErrors: InquiryErrors = {};
        for (const field of inquiryFields) if (response.fields?.[field]) fieldErrors[field] = response.fields[field];
        setServerValidation({ signature, errors: fieldErrors, maxGuests: response.maxGuests });
        if (!Object.keys(fieldErrors).length) setStatus('error');
        return;
      }
      if (!res.ok) throw new Error(t('error'));
      setFields({ name: '', email: '', phone: '', body: '' });
      setServerValidation(null);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center text-gray-500 font-light tracking-wide p-8">
        {t('exito')}
      </div>
    );
  }

  return (
    <form
          noValidate
          lang={formatoLocale}
          action={handleSubmit}
          className={compact ? formClasses + ' space-y-3' : 'space-y-6'}
        >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="lang" value={locale} />

      {/* ===== DATOS PERSONALES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('nombre')}
          </label>
          <input
            required
            type="text"
            id="name"
            name="name"
            minLength={2}
            maxLength={100}
            value={fields.name}
            onChange={event => setFields(current => ({ ...current, name: event.target.value }))}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor="email" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('email')}
          </label>
          <input
            required
            type="email"
            id="email"
            name="email"
            value={fields.email}
            onChange={event => setFields(current => ({ ...current, email: event.target.value }))}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('email')}
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('telefono')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={fields.phone}
            maxLength={25}
            onChange={event => setFields(current => ({ ...current, phone: event.target.value }))}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('phone')}
        </div>
      </div>

      {/* ===== FECHAS + HUESPEDES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('llegada')}
          </label>
          <input
            required
            type="date"
            id="startDate"
            name="startDate"
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'startDate-error' : undefined}
            lang={formatoLocale}
            value={startDate}
            min={hoy}
            onChange={e => setDates(actual => ({ ...actual, startDate: e.target.value }))}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('startDate')}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('salida')}
          </label>
          <input
            required
            type="date"
            id="endDate"
            name="endDate"
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'endDate-error' : undefined}
            lang={formatoLocale}
            value={endDate}
            min={startDate || hoy}
            onChange={e => setDates(actual => ({ ...actual, endDate: e.target.value }))}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('endDate')}
        </div>
        <div>
          <label htmlFor="guests" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('huespedes')}
          </label>
          <input
            required
            type="number"
            id="guests"
            name="guests"
            min="1"
            max={maxGuests}
            step={1}
            aria-invalid={!!errors.guests}
            aria-describedby={errors.guests ? 'guests-error' : undefined}
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
          {fieldError('guests')}
        </div>
        <div>
          <label className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            {t('precioTotal')}
          </label>
          <div className="border-b border-gray-300 pb-2 text-lg font-light text-gray-800 h-7 flex items-end">
            {cotizacion?.total != null ? (
              `$${cotizacion.total.toLocaleString(formatoLocale)} MXN`
            ) : startDate && endDate ? (
              <span className="text-gray-400 text-sm">{t('consultar')}</span>
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ===== MENSAJE ===== */}
      <div>
        <label htmlFor="body" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
          {t('mensaje')}
        </label>
        <textarea
          required
          id="body"
          name="body"
          rows={3}
          value={fields.body}
          onChange={event => setFields(current => ({ ...current, body: event.target.value }))}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? 'body-error' : undefined}
          className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent resize-none"
        ></textarea>
        {fieldError('body')}
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-xs tracking-wide">{t('error')}</p>
      )}

      <SubmitButton disabled={Object.keys(errors).length > 0} />
    </form>
  );
}
