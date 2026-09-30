// apps/web/src/components/CategorySection.tsx
import SectionSlider from './SectionSlider';

type Slide = { url: string; type: 'PHOTO' | 'VIDEO' };
type Item = { icon: string; label: string };

export default function CategorySection({
  label,
  items,
  slides,
  reverse = false,
}: {
  label: string;
  items: Item[];
  slides: Slide[];
  reverse?: boolean;
}) {

  const columnaInfo = (
    <div className="flex flex-col justify-center px-6 py-12 md:px-12">
      <div className="rounded-2xl bg-white/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40">
        <h2 className="mb-8 text-2xl font-light tracking-[0.3em] text-gray-900">
          {label}
        </h2>
        <ul className="space-y-4">
          {/* ...igual que antes... */}
        </ul>
      </div>
    </div>
  );

  const columnaImagen =
    slides.length > 0 ? (
      <div className="min-h-[60vh]">
        <SectionSlider slides={slides} />
      </div>
    ) : null;

  if (!columnaImagen) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      {reverse ? <>{columnaImagen}{columnaInfo}</> : <>{columnaInfo}{columnaImagen}</>}
    </section>
  );
}
