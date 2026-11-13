import styles from './PageLoading.module.css';

// T-4835: lo que muestran los loading.tsx públicos mientras llega la página al navegar: el emblema del header
// al centro, sobre papel. Aparece a los 150 ms (si la página llega antes, no se ve nada) con un cuarto de
// vuelta; al llegar, el contenido entra con content-arrival. Antes eran esqueletos con shimmer.
export default function PageLoading({ variant }: { variant: 'home' | 'list' | 'detail' }) {
  return (
    <main className={`page-loading public-paper relative grid min-h-screen place-items-center ${styles.screen}`} aria-busy="true" data-variant={variant}>
      <span aria-hidden="true" className={`loading-emblem ${styles.emblem}`} />
    </main>
  );
}
