// T-4944: «Cómo funciona» en pasos numerados. La numeración la da <ol>, así los lectores de pantalla la anuncian.
export default function StepsList({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <h3 className="mb-6 text-center text-xl font-light tracking-widest">{title}</h3>
      <ol className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
        {steps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl border border-gray-200 p-6 dark:border-gray-700">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-700 text-green-800 dark:border-green-400 dark:text-green-300">{index + 1}</span>
          <p className="min-w-0 break-words text-sm leading-relaxed">{step}</p>
        </li>)}
      </ol>
    </div>
  );
}
