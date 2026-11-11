'use client';
// T-4738: edición del desglose de una reserva. Todo se calcula con las MISMAS funciones del servidor
// (lib/booking-breakdown.ts):
// - Renta: precargada con la tarifa de la propiedad (suggestedRent) si no hay dato guardado; editable.
// - Impuestos: IVA 16 % de renta + aseo, recalculado en vivo mientras esté en modo automático. Escribir otro
//   importe lo pasa a manual; «Calcular 16 %» lo devuelve a automático. Editable.
// - Comisión del colaborador: renta × % congelado. Solo lectura.
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { breakdownFields, breakdownTotal, commissionAmount, formatMoney, parseAmount, suggestedTaxes } from '@/lib/booking-breakdown';
import { panelRequest, inputClass, buttonClass } from './request';

type Field = typeof breakdownFields[number];
type Values = Record<Field, string>;
const secondaryButton = 'min-h-11 rounded-lg border border-green-700 px-3 text-sm text-green-800 disabled:opacity-50 dark:border-green-400 dark:text-green-300';

export default function BookingBreakdownForm({ id, initial, commissionPercent, suggestedRent = null }: {
  id: string; initial: Record<Field, string | null>; commissionPercent: string | null; suggestedRent?: string | null;
}) {
  const t = useTranslations('bookingDetail'), errors = useTranslations('panel'), locale = useLocale(), router = useRouter();
  const rentPrefilled = initial.rentAmount == null && suggestedRent != null;
  const [values, setValues] = useState<Values>({ rentAmount: initial.rentAmount ?? suggestedRent ?? '', cleaningCost: initial.cleaningCost ?? '', taxes: initial.taxes ?? '' });
  // Automático si no hay impuesto guardado o si el guardado coincide con el 16 % de lo guardado.
  const [taxesAuto, setTaxesAuto] = useState(initial.taxes == null || initial.taxes === suggestedTaxes(initial.rentAmount, initial.cleaningCost));
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState('');

  const amount = (raw: string) => { const result = parseAmount(raw); return result.ok ? result.value : null; };
  const autoTaxes = suggestedTaxes(amount(values.rentAmount), amount(values.cleaningCost));
  const shown: Values = { ...values, taxes: taxesAuto ? autoTaxes ?? '' : values.taxes };
  const parsed = Object.fromEntries(breakdownFields.map(field => [field, parseAmount(shown[field])])) as Record<Field, ReturnType<typeof parseAmount>>;
  const valueOf = (field: Field) => { const result = parsed[field]; return result.ok ? result.value : null; };
  const invalid = breakdownFields.filter(field => !parsed[field].ok);
  const commission = commissionAmount(valueOf('rentAmount'), commissionPercent);
  const total = breakdownTotal(breakdownFields.map(valueOf));
  const change = (field: Field, value: string) => {
    setSaved(false);
    if (field === 'taxes') setTaxesAuto(false);
    setValues(current => ({ ...current, [field]: value }));
  };

  return <form className="space-y-6" noValidate onSubmit={async event => {
    event.preventDefault();
    if (invalid.length || busy) return;
    setBusy(true); setSaved(false); setError('');
    try {
      await panelRequest(`/api/panel/bookings/${encodeURIComponent(id)}`, 'PATCH',
        Object.fromEntries(breakdownFields.map(field => [field, valueOf(field)])));
      setSaved(true); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'error'); }
    finally { setBusy(false); }
  }}>
    {rentPrefilled && <p role="status" className="rounded-lg border border-green-700 p-3 text-sm">{t('rentPrefilled')}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      {breakdownFields.map(field => <div key={field} className="space-y-1">
        <label className="block space-y-1">
          <span>{t(field)}</span>
          <input name={field} inputMode="decimal" autoComplete="off" value={shown[field]} aria-invalid={!parsed[field].ok}
            aria-describedby={`${field}-help`} className={inputClass} onChange={event => change(field, event.target.value)} />
        </label>
        <span id={`${field}-help`} className={`block text-sm ${parsed[field].ok ? 'text-gray-600 dark:text-gray-300' : 'text-red-700 dark:text-red-400'}`}>
          {!parsed[field].ok ? t('invalidAmount') : field === 'taxes' ? t(taxesAuto ? 'taxesAuto' : 'taxesManual') : field === 'rentAmount' && suggestedRent == null ? t('noSuggestedRent') : t('amountHelp')}
        </span>
        {field === 'rentAmount' && suggestedRent != null && valueOf('rentAmount') !== suggestedRent &&
          <button type="button" className={secondaryButton} onClick={() => change('rentAmount', suggestedRent)}>
            {t('useSuggestedRent', { amount: formatMoney(suggestedRent, locale) })}</button>}
        {field === 'taxes' && !taxesAuto &&
          <button type="button" className={secondaryButton} onClick={() => { setSaved(false); setTaxesAuto(true); }}>{t('applyTaxes')}</button>}
      </div>)}
    </div>
    <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3 dark:border-gray-700">
      <div><dt className="text-sm text-gray-600 dark:text-gray-300">{t('commissionPercent')}</dt>
        <dd className="text-lg font-semibold">{commissionPercent == null ? t('noReferral') : `${commissionPercent} %`}</dd></div>
      <div><dt className="text-sm text-gray-600 dark:text-gray-300">{t('commissionAmount')}</dt>
        <dd className="text-lg font-semibold" aria-live="polite" data-testid="commission">{commissionPercent == null ? '—' : formatMoney(commission, locale)}</dd></div>
      <div><dt className="text-sm text-gray-600 dark:text-gray-300">{t('total')}</dt>
        <dd className="text-lg font-semibold" aria-live="polite" data-testid="total">{formatMoney(total, locale)}</dd></div>
      <p className="text-sm text-gray-600 sm:col-span-3 dark:text-gray-300">{t('commissionHelp')}</p>
    </dl>
    <div className="space-y-2">
      <button type="submit" disabled={busy || invalid.length > 0} className={buttonClass}>{t('save')}</button>
      {saved && <p role="status">{t('saved')}</p>}
      {error && <p role="alert">{errors(error)}</p>}
    </div>
  </form>;
}
