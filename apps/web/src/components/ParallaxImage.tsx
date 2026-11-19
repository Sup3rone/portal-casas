// T-4944: foto con parallax. La capa es un 20 % más alta que el marco y se desplaza con el scroll
// solo con CSS (animation-timeline: view(), ParallaxImage.module.css). Sin soporte o con reduced-motion queda quieta.
import Image from 'next/image';
import { unoptimizedFor } from '@/lib/image-src';
import styles from './ParallaxImage.module.css';

type Props = { src: string; alt?: string; sizes: string; className?: string; priority?: boolean };

export default function ParallaxImage({ src, alt = '', sizes, className = '', priority = false }: Props) {
  return <div data-parallax className={`parallax-frame relative overflow-clip ${className}`.trim()}>
    <div className={`${styles.layer} absolute inset-x-0 -top-[10%] h-[120%]`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={unoptimizedFor(src)} className="object-cover" />
    </div>
  </div>;
}
