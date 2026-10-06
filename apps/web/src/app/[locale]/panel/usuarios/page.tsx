import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { adminUsersPage, listAdminUsers, userRoles } from '@/lib/admin-users';
import { inputClass, buttonClass } from '@/components/panel/request';

export default async function UsersPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string; role?: string; page?: string }>;
}) {
  await adminUsersPage();
  const { locale } = await params, query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'adminUsers' });
  const email = (query.email || '').slice(0, 254), role = query.role || '';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(query.page) || 1)));
  const { rows, hasNext } = await listAdminUsers(email, role, page);
  const href = (number: number) => `/panel/usuarios?${new URLSearchParams({ email, role, page: String(number) })}`;
  return <section className="space-y-6">
    <h1 className="text-3xl font-semibold">{t('title')}</h1>
    <form className="flex flex-wrap items-end gap-4">
      <label>{t('email')}<input name="email" defaultValue={email} maxLength={254} className={inputClass} /></label>
      <label>{t('role')}<select name="role" defaultValue={role} className={inputClass}><option value="">{t('all')}</option>
        {userRoles.map(value => <option key={value} value={value}>{t(`roles.${value}`)}</option>)}</select></label>
      <button type="submit" className={buttonClass}>{t('search')}</button>
    </form>
    <div className="overflow-x-auto"><table className="w-full text-left">
      <thead><tr>{['email', 'role', 'properties', 'created', 'status'].map(key => <th key={key} scope="col" className="p-2">{t(key)}</th>)}</tr></thead>
      <tbody>{rows.map(user => <tr key={user.id} className="border-t dark:border-gray-700">
        <td className="p-2"><Link className="text-green-700 dark:text-green-400 underline" href={`/panel/usuarios/${user.id}`}>{user.email}</Link></td>
        <td className="p-2">{t(`roles.${user.role}`)}</td><td className="p-2">{user.propertyCount}</td>
        <td className="p-2">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(user.createdAt)}</td>
        <td className="p-2">{t(user.hasPassword ? 'withPassword' : 'withoutPassword')}</td>
      </tr>)}</tbody></table></div>
    {!rows.length && <p>{t('empty')}</p>}
    <nav aria-label={t('pagination')} className="flex gap-4">
      {page > 1 && <Link href={href(page - 1)}>{t('previous')}</Link>}<span>{t('page', { number: page })}</span>
      {hasNext && <Link href={href(page + 1)}>{t('next')}</Link>}
    </nav>
  </section>;
}
