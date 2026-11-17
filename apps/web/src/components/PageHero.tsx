// T-4944: cabecera de las páginas informativas. Con imagen: foto a sangre con velo; sin ella: sobre papel.
import Image from 'next/image';
import type { ReactNode } from 'react';
import { unoptimizedFor } from '@/lib/image-src';

type Props = { eyebrow?: string; title: string; text?: string; image?: string; children?: ReactNode };

export default function PageHero({ eyebrow, title, text, image, children }: Props) {
  return (
    <section data-page-hero className={`relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-24 text-center${image ? ' text-white' : ''}`}>
      {image && <>
        <Image src={image} alt="" fill priority unoptimized={unoptimizedFor(image)} sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/45 dark:bg-black/60" />
      </>}
      <div className="enter-on-paint mx-auto max-w-3xl">
        {eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.3em] opacity-80">{eyebrow}</p>}
        <h1 className="break-words text-3xl font-light tracking-[0.2em] md:text-5xl">{title}</h1>
        {text && <p className="mx-auto mt-6 max-w-2xl break-words leading-relaxed opacity-90">{text}</p>}
        {children}
      </div>
    </section>
  );
}
