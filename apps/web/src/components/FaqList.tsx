// T-4944: preguntas frecuentes con <details>: se abren sin JavaScript y con teclado.
type Item = { question: string; answer: string };

export default function FaqList({ title, items }: { title: string; items: Item[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="mb-6 text-center text-xl font-light tracking-widest">{title}</h3>
      <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
        {items.map(item => <details key={item.question} className="group px-6">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-4 font-medium focus-visible:outline-2 focus-visible:outline-green-700">
            <span className="min-w-0 break-words">{item.question}</span>
            <span aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="break-words pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.answer}</p>
        </details>)}
      </div>
    </div>
  );
}
