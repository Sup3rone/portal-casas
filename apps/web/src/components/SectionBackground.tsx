import Image from 'next/image';
import type { ReactNode } from 'react';

export default function SectionBackground({ url, name, className, label, id, children }: {
  url?: string | null; name: string; className: string; label?: string; id?: string; children: ReactNode;
}) {
  return <section id={id} data-detail-section={name} aria-label={label}
    style={url ? { height: 'auto', minHeight: '100dvh' } : undefined}
    className={`relative isolate ${className}${url ? ' section-background-photo [&_.text-gray-400]:text-gray-600 dark:[&_.text-gray-400]:text-gray-300' : ''}`}>
    {url && <div data-section-background={name} className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2" aria-hidden="true">
      <Image src={url} alt="" fill unoptimized sizes="100vw" className="object-cover" />
    </div>}
    {children}
  </section>;
}
