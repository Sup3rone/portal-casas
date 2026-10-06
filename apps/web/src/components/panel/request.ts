export async function panelRequest(url: string, method: string, body?: unknown) {
  let response: Response;
  try { response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new Error('error'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 404 ? 'notFound' : response.status === 403 || response.status === 401 ? 'forbidden' : response.status === 400 ? 'validation' : response.status === 409 ? 'conflict' : 'error');
  return data;
}
export const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-green-700 focus:outline-none';
export const buttonClass = 'rounded-lg bg-green-700 px-4 py-2 font-medium text-white dark:text-gray-100 disabled:opacity-50';
