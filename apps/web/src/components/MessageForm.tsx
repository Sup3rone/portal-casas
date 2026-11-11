// apps/web/src/components/MessageForm.tsx
'use client';

import { useContext, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { SessionContext } from 'next-auth/react';
import { track } from '@vercel/analytics';
import { useReservationDates } from './ReservationDatesProvider';
import { quoteStay } from '@/lib/stay-quote';
import { inquiryFields, inquiryFromFormData, inquiryToday, validateInquiry, type InquiryErrors, type InquiryField } from '@/lib/inquiry-validation';

// T-4770: solo se deshabilita mientras envía. Con datos incompletos se puede pulsar y el formulario explica qué falta.
function SubmitButton() {
  const t = useTranslations('details.form');
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gray-900 dark:bg-green-700 hover:bg-gray-700 dark:hover:bg-green-600 text-white dark:text-gray-100 font-light tracking-[0.25em] py-4 px-4 transition-colors disabled:opacity-50 uppercase"
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



// Cuenta noche por noche (checkout no se cobra). Regla compartida con la renta automática del panel (T-4738).
function calcularCotizacion(startStr: string, endStr: string, pricing: PricingInfo) {
  const quote = quoteStay(startStr, endStr, pricing);
  return quote && { total: quote.total, noches: quote.nights, choque: quote.overlap };
}

export default function MessageForm({
  propertyId,
  propertySlug,
  locale,
  pricing,
  maxGuests,
  compact = false,
  mode = 'booking',
}: {
  propertyId: string;
  propertySlug?: string;
  locale: string;
  compact?: boolean;
} & ({ mode: 'annual'; pricing?: never; maxGuests?: never } | { mode?: 'booking'; pricing: PricingInfo; maxGuests: number })) {
  const t = useTranslations('details.form');
  const formatoLocale = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'es-MX';
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rateError, setRateError] = useState('');
  const { dates: { startDate, endDate }, setDates } = useReservationDates();
  const [guests, setGuests] = useState<number>(1);
  // T-4770: con sesión iniciada, nombre y correo salen de la cuenta mientras el visitante no los edite
  // (null = sin editar). Se lee en el cliente para no volver dinámica la ficha (generateStaticParams).
  // useContext y no useSession: sin SessionProvider (vistas aisladas, tests) no lanza; solo no autollena.
  const session = useContext(SessionContext)?.data;
  const emptyFields = { name: null as string | null, email: null as string | null, phone: '', body: '' };
  const [rawFields, setFields] = useState(emptyFields);
  const fields = { ...rawFields, name: rawFields.name ?? session?.user?.name ?? '', email: rawFields.email ?? session?.user?.email ?? '' };
  const [touched, setTouched] = useState<Partial<Record<InquiryField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverValidation, setServerValidation] = useState<{ signature: string; errors: InquiryErrors; maxGuests?: number } | null>(null);
  const hoy = inquiryToday();
  const contactOnly = mode === 'annual';
  const validationContext = { today: hoy, contactOnly, maxGuests, bookings: pricing?.booked.map(booking => ({ startDate: booking.start, endDate: booking.end })) };
  const input = { ...fields, guests, startDate, endDate };
  const signature = JSON.stringify(input);
  const localErrors = validateInquiry(input, validationContext);
  const serverErrors = serverValidation?.signature === signature ? serverValidation : null;
  const validationErrors: InquiryErrors = { ...localErrors, ...serverErrors?.errors };
  const errors: InquiryErrors = Object.fromEntries(inquiryFields
    .filter(field => (submitted || touched[field]) && validationErrors[field])
    .map(field => [field, validationErrors[field]]));
  function fieldError(field: InquiryField) {
    return errors[field] ? <p id={`${field}-error`} className="text-red-600 dark:text-red-400 text-xs tracking-wide" aria-live="polite">
      {t(`validation.${errors[field]}`, { maxGuests: serverErrors?.maxGuests ?? maxGuests ?? 0 })}
    </p> : null;
  }

  const cotizacion = useMemo(
    () => !contactOnly && pricing && startDate && endDate ? calcularCotizacion(startDate, endDate, pricing) : null,
    [contactOnly, startDate, endDate, pricing]
  );

  // En globals.css o directamente en el component:
  const formClasses = compact
    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-4'
    : '';

  async function handleSubmit(formData: FormData) {
    setRateError('');
    setSubmitted(true);
    const submitted = inquiryFromFormData(formData);
    const checked = validateInquiry(submitted, { ...validationContext, today: inquiryToday() });
    if (Object.keys(checked).length) {
      // T-4770: lleva al primer campo con error (el aviso general y los errores en rojo ya se muestran con submitted).
      const first = inquiryFields.find(field => checked[field]);
      if (first && typeof document !== 'undefined') document.getElementById(first)?.focus();
      return;
    }
    try {
      const res = await fetch('/api/messages', { method: 'POST', body: formData });
      if (res.status === 429) {
        const response = await res.json();
        setRateError(response.message); setStatus('error');
        return;
      }
      if (res.status === 400) {
        const response = await res.json();
        const fieldErrors: InquiryErrors = {};
        for (const field of inquiryFields) if (response.fields?.[field]) fieldErrors[field] = response.fields[field];
        setServerValidation({ signature, errors: fieldErrors, maxGuests: response.maxGuests });
        if (!Object.keys(fieldErrors).length) setStatus('error');
        return;
      }
      if (!res.ok) throw new Error(t('error'));
      // Solo tras la confirmación del servidor; sin datos personales.
      if (propertySlug) {
        try { track('query_submitted', { property: propertySlug }); } catch { /* No alterar el envío confirmado. */ }
      }
      setFields(emptyFields); // Vuelven los datos de la cuenta, si hay sesión.
      setTouched({}); setSubmitted(false);
      setServerValidation(null);
      // T-4770: el aviso de recibido se queda hasta que el visitante pulse «Enviar otra consulta».
      setStatus('success');
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="space-y-6 text-center text-gray-700 dark:text-gray-200 font-light tracking-wide p-8">
        {/* La consulta anual no genera reserva: conserva su mensaje de contacto. */}
        <p>{t(contactOnly ? 'exito' : 'exitoReserva')}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="w-full border border-gray-900 dark:border-green-500 text-gray-900 dark:text-gray-100 font-light tracking-[0.25em] py-4 px-4 uppercase transition-colors hover:bg-gray-900 hover:text-white dark:hover:bg-green-700"
        >
          {t('otraConsulta')}
        </button>
      </div>
    );
  }

  return (
    <form
          noValidate
          lang={formatoLocale}
          action={handleSubmit}
          onBlur={event => {
            const field = event.target.getAttribute('name') as InquiryField;
            if (inquiryFields.includes(field)) setTouched(current => ({ ...current, [field]: true }));
          }}
          className={(compact ? formClasses + ' space-y-3' : 'space-y-6') + (contactOnly ? ' [&_input:not([type=hidden])]:min-h-11 [&_textarea]:min-h-11 [&_button]:min-h-11 [&_input]:focus-visible:outline-2 [&_textarea]:focus-visible:outline-2 [&_button]:focus-visible:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-current' : '')}
        >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="lang" value={locale} />

      {/* ===== DATOS PERSONALES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
            {t('nombre')}
          </label>
          <input
            required
            type="text"
            id="name"
            name="name"
            minLength={2}
            maxLength={100}
            placeholder={contactOnly ? t('namePlaceholder') : undefined}
            value={fields.name}
            onChange={event => setFields(current => ({ ...current, name: event.target.value }))}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor="email" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
            {t('email')}
          </label>
          <input
            required
            type="email"
            id="email"
            name="email"
            placeholder={contactOnly ? t('emailPlaceholder') : undefined}
            value={fields.email}
            onChange={event => setFields(current => ({ ...current, email: event.target.value }))}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('email')}
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
            {t('telefono')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder={contactOnly ? t('phonePlaceholder') : undefined}
            value={fields.phone}
            maxLength={25}
            onChange={event => setFields(current => ({ ...current, phone: event.target.value }))}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('phone')}
        </div>
      </div>

      {/* ===== FECHAS + HUESPEDES ===== */}
      {!contactOnly && <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
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
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('startDate')}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
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
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('endDate')}
        </div>
        <div>
          <label htmlFor="guests" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
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
            className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent"
          />
          {fieldError('guests')}
        </div>
        <div>
          <label className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
            {t('precioTotal')}
          </label>
          <div className="border-b border-gray-300 dark:border-gray-600 pb-2 text-lg font-light text-gray-800 dark:text-gray-100 h-7 flex items-end">
            {cotizacion?.total != null ? (
              `$${cotizacion.total.toLocaleString(formatoLocale)} MXN`
            ) : startDate && endDate ? (
              <span className="text-gray-400 dark:text-gray-300 text-sm">{t('consultar')}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-300 text-sm">—</span>
            )}
          </div>
        </div>
      </div>}
      {/* ===== MENSAJE ===== */}
      <div>
        <label htmlFor="body" className="block text-xs tracking-[0.25em] text-gray-400 dark:text-gray-300 mb-2 uppercase">
          {t('mensaje')}
        </label>
        <textarea
          required
          id="body"
          name="body"
          placeholder={contactOnly ? t('messagePlaceholder') : undefined}
          rows={3}
          value={fields.body}
          onChange={event => setFields(current => ({ ...current, body: event.target.value }))}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? 'body-error' : undefined}
          className="w-full border-b border-gray-300 dark:border-gray-600 pb-2 text-gray-800 dark:text-gray-100 font-light focus:border-gray-900 dark:focus:border-green-500 focus:outline-none bg-transparent resize-none"
        ></textarea>
        {fieldError('body')}
      </div>

      {/* T-4770: aviso general si se intentó enviar con datos faltantes o por corregir. */}
      {submitted && Object.keys(validationErrors).length > 0 && (
        <p id="inquiry-incomplete" role="alert" className="text-red-600 dark:text-red-400 text-xs tracking-wide">{t('incompleto')}</p>
      )}

      {status === 'error' && (
        <p className="text-red-600 dark:text-red-400 text-xs tracking-wide">{rateError || t('error')}</p>
      )}

      <SubmitButton />
    </form>
  );
}
