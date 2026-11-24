// T-5201: tarjeta de una casa libre en /panel/vender. Abre la ficha para enseñarla (Task 4) con las mismas fechas.
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { VendorCard as Card } from '@/lib/vendor-availability';

export type VendorCardLabels = { free: string; draft: string; specs: string; nights: string; total: string };

export default function VendorCard({ card, href, labels }: { card: Card; href: string; labels: VendorCardLabels }) {
  return <li>
    <Link href={href} className="block overflow-hidden rounded-2xl border border-gray-200 transition hover:shadow-lg focus-visible:outline-2 dark:border-gray-700">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {card.cover && <Image src={card.cover} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />}
        <span className="absolute left-3 top-3 rounded-full bg-green-700 px-3 py-1 text-xs font-semibold text-white">{labels.free}</span>
        {!card.published && <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white">{labels.draft}</span>}
      </div>
      <div className="space-y-1 p-4">
        <h2 className="text-lg font-semibold break-words">{card.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{labels.specs}</p>
        <p className="flex items-baseline justify-between gap-3 pt-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">{labels.nights}</span>
          <span className="text-xl font-semibold">{labels.total}</span>
        </p>
      </div>
    </Link>
  </li>;
}
