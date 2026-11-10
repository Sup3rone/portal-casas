// T-4719: cualquier URL localizada sin ruta propia muestra la 404 de marca
// ([locale]/not-found.tsx) dentro del layout, en vez de la 404 genérica de Next.
import { notFound } from 'next/navigation';

export default function CatchAllNotFound() {
  notFound();
}
