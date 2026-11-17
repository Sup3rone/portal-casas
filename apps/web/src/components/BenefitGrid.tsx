// T-4944: tarjetas de beneficios o valores (3 o 4). Sin estado: componente de servidor.
type Item = { title: string; text: string };

export default function BenefitGrid({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h3 className="mb-6 text-center text-xl font-light tracking-widest">{title}</h3>
      <ul className={`grid gap-4 sm:grid-cols-2 ${items.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {items.map(item => <li key={item.title} className="rounded-2xl border border-gray-200 bg-white/80 p-6 dark:border-gray-700 dark:bg-gray-900/80">
          <p className="mb-2 break-words font-medium">{item.title}</p>
          <p className="break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.text}</p>
        </li>)}
      </ul>
    </div>
  );
}
