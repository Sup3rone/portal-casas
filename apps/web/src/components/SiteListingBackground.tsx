'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function SiteListingBackground({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return <Image src={failed || !url ? '/images/listado-bg.jpg' : url} alt="" fill unoptimized sizes="100vw" className="h-full w-full object-cover" onError={() => setFailed(true)} />;
}
