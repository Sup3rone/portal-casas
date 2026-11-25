// T-5310: correos que envió el portal (solo ADMIN). Sin contenido: fecha, tipo, destinatarios, asunto, estado y motivo.
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { EMAIL_LOG_DAYS, emailKinds } from '@/lib/email-log';
import { emailLogPage, listEmailLog } from '@/lib/email-log-admin';
import { inputClass, buttonClass } from '@/components/panel/request';

export const dynamic = 'force-dynamic';

export default async function EmailLogPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string; kind?: string; q?: string; page?: string }>;
}) {
  await emailLogPage();
  const { locale } = await params, query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'emailLog' });
  const status = query.status === 'sent' || query.status === 'failed' ? query.status : '';
  const kind = (emailKinds as readonly string[]).includes(query.kind ?? '') ? query.kind! : '';
  const { rows, hasNext, page, search } = await listEmailLog({ status, kind, search: query.q, page: Number(query.page) || 1 });
  const href = (number: number) => `/panel/correos?${new URLSearchParams({ status, kind, q: search, page: String(number) })}`;
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' });
  return <section className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('intro', { days: EMAIL_LOG_DAYS })}</p>
    </header>
    <form className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">{t('search')}<input name="q" type="search" defaultValue={search} maxLength={254} className={inputClass} /></label>
      <label className="flex flex-col gap-1">{t('status')}<select name="status" defaultValue={status} className={inputClass}>
        <option value="">{t('all')}</option><option value="sent">{t('statuses.sent')}</option><option value="failed">{t('statuses.failed')}</option></select></label>
      <label className="flex flex-col gap-1">{t('kind')}<select name="kind" defaultValue={kind} className={inputClass}>
        <option value="">{t('all')}</option>{emailKinds.map(value => <option key={value} value={value}>{t(`kinds.${value}`)}</option>)}</select></label>
      <button type="submit" className={buttonClass}>{t('filter')}</button>
    </form>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr>{(['date', 'kind', 'recipients', 'subject', 'status'] as const).map(key => <th key={key} scope="col" className="p-2">{t(key)}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.id} data-email-status={row.status} className="border-t align-top dark:border-gray-700">
        <td className="whitespace-nowrap p-2">{when.format(new Date(row.createdAt))}</td>
        <td className="p-2">{t(`kinds.${row.kind}`)}</td>
        <td className="break-all p-2">{(row.recipients ?? []).join(', ')}</td>
        <td className="p-2">{row.subject}</td>
        <td className="p-2">
          <span className={row.status === 'sent' ? 'font-semibold text-green-800 dark:text-green-300' : 'font-semibold text-red-700 dark:text-red-400'}>{t(`statuses.${row.status}`)}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{t(`providers.${row.provider}`)}</span>
          {row.error && <span className="block break-words text-xs text-red-700 dark:text-red-400">{row.error}</span>}
        </td>
      </tr>)}</tbody></table></div>
    {!rows.length && <p>{t('empty')}</p>}
    <nav aria-label={t('pagination')} className="flex gap-4">
      {page > 1 && <Link href={href(page - 1)}>{t('previous')}</Link>}<span>{t('page', { number: page })}</span>
      {hasNext && <Link href={href(page + 1)}>{t('next')}</Link>}
    </nav>
  </section>;
}
