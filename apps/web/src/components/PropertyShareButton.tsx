'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type ShareStatus = 'idle' | 'shared' | 'copied' | 'error';
type ShareProps = { title: string; lat?: number | null; lng?: number | null; address?: string | null; city?: string | null };

export function propertyLocationUrl({ lat, lng, address, city }: Omit<ShareProps, 'title'>) {
  const coordinates = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const query = coordinates ? `${lat},${lng}` : [address?.trim(), city?.trim()].filter(Boolean).join(', ');
  return query ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query) : null;
}

export function propertyShareData(props: ShareProps, pageUrl: string) {
  const caption = [props.title, props.city?.trim()].filter(Boolean).join(' — ');
  return { title: caption, text: caption, url: propertyLocationUrl(props) || pageUrl };
}

export async function shareProperty(data: { title: string; text?: string; url: string }, browser: Pick<Navigator, 'share' | 'clipboard'> = navigator): Promise<Exclude<ShareStatus, 'error'>> {
  if (browser.share) {
    try {
      await browser.share(data);
      return 'shared';
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'idle';
    }
  }
  await browser.clipboard.writeText(data.url);
  return 'copied';
}

export default function PropertyShareButton(props: ShareProps) {
  const t = useTranslations('details.share');
  const locationUrl = propertyLocationUrl(props);
  const action = t(locationUrl ? 'locationAction' : 'action');
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleShare() {
    setPending(true);
    try { setStatus(await shareProperty(propertyShareData(props, window.location.href))); }
    catch { setStatus('error'); }
    finally { setPending(false); }
  }

  return (
    <div className="absolute right-3 top-3 z-10">
      <button type="button" onClick={handleShare} disabled={pending} aria-label={action} title={action}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:opacity-50">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
          <path d="m8 10 8-4M8 14l8 4" />
          <circle cx="5" cy="12" r="3" /><circle cx="19" cy="5" r="3" /><circle cx="19" cy="19" r="3" />
        </svg>
      </button>
      <span role="status" aria-live="polite" className={status === 'idle' ? 'sr-only' : 'absolute right-0 top-full mt-2 w-max max-w-60 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 shadow-sm'}>
        {status === 'idle' ? '' : t(locationUrl && status === 'copied' ? 'locationCopied' : locationUrl && status === 'shared' ? 'locationShared' : status)}
      </span>
    </div>
  );
}
