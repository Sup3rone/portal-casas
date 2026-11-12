'use client';
import { useState } from 'react';
import Image from 'next/image';
import { unoptimizedFor } from '@/lib/image-src';

export default function SiteListingBackground({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed || !url ? '/images/listado-bg.jpg' : url;
  return <Image src={src} alt="" fill unoptimized={unoptimizedFor(src)} sizes="100vw" className="h-full w-full object-cover" onError={() => setFailed(true)} />;
}
