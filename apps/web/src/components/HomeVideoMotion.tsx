'use client';
import { useEffect } from 'react';
import { homeVideoDesktopQuery, homeVideoFallback, videosForViewport, type HomeVideo } from '@/lib/home-videos';

// Controlar el video existente, sin reemplazarlo ni duplicarlo.
// T-4679: con más de un video para el viewport, alterna dos <video> en `ended`
// (el siguiente se precarga al pasar la mitad del actual) y repite en loop.
export default function HomeVideoMotion({ videos = [] }: { videos?: HomeVideo[] } = {}) {
  useEffect(() => {
    const video = document.getElementById('home-background-video') as HTMLVideoElement | null;
    if (!video) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const list = videosForViewport(videos, window.matchMedia(homeVideoDesktopQuery).matches).map(item => item.url);
    const spare = list.length > 1 ? document.getElementById('home-background-video-next') as HTMLVideoElement | null : null;
    if (spare && spare !== video) return playlist(video, spare, list, motion);
    let fallbackUsed = false;
    function fallback() {
      if (fallbackUsed) return;
      fallbackUsed = true;
      video!.src = homeVideoFallback;
      video!.load();
      if (!motion.matches) void video!.play().catch(() => {});
    }
    function update() {
      if (motion.matches) video!.pause();
      else {
        // Si la fuente fue descartada por media=reduce, volver a seleccionarla.
        if (video!.networkState === 3) video!.load();
        void video!.play().catch(() => {});
      }
    }
    motion.addEventListener('change', update);
    video.addEventListener('error', fallback, true);
    update();
    return () => { motion.removeEventListener('change', update); video.removeEventListener('error', fallback, true); video.pause(); };
  }, [videos]);
  return null;
}

function playlist(first: HTMLVideoElement, second: HTMLVideoElement, list: string[], motion: MediaQueryList) {
  const players = [first, second];
  let active = 0, index = 0, prepared = -1, spareFailed = false, switching = false;
  const current = () => players[active], spare = () => players[1 - active];
  const show = (player: HTMLVideoElement, visible: boolean) => { player.style.opacity = visible ? '1' : '0'; };
  // Sin loop ni autoplay: con autoplay, precargar el siguiente en el reproductor oculto lo arrancaría.
  first.loop = false; second.loop = false; first.autoplay = false; second.autoplay = false;
  show(first, true); show(second, false);

  function prepare() {
    const next = (index + 1) % list.length;
    if (prepared === next) return;
    prepared = next; spareFailed = false;
    const player = spare();
    player.preload = 'auto';
    player.src = list[next];
    player.load();
  }
  function onTime(event: Event) {
    const player = event.currentTarget as HTMLVideoElement;
    if (player !== current() || !player.duration) return;
    if (player.currentTime > player.duration / 2) prepare();
  }
  function advance() {
    if (switching) return;
    prepare();
    const from = current(), to = spare(), next = prepared;
    if (spareFailed) {
      // Saltar el video que no cargó y repetir el actual hasta el siguiente ciclo.
      index = next; prepared = -1; spareFailed = false;
      from.currentTime = 0;
      if (!motion.matches) void from.play().catch(() => {});
      return;
    }
    switching = true;
    to.currentTime = 0;
    const swap = () => {
      to.removeEventListener('playing', swap);
      show(to, true); show(from, false);
      from.pause();
      active = 1 - active; index = next; prepared = -1; switching = false;
    };
    to.addEventListener('playing', swap);
    if (motion.matches) { swap(); return; }
    void to.play().catch(() => { to.removeEventListener('playing', swap); switching = false; spareFailed = true; advance(); });
  }
  function onEnded(event: Event) {
    // Solo cuenta el final del video visible; el oculto nunca decide el cambio.
    if (event.currentTarget === current()) advance();
  }
  function onError(event: Event) {
    const player = event.currentTarget as HTMLVideoElement;
    if (player === spare()) spareFailed = true;
    else advance();
  }
  function update() {
    if (motion.matches) players.forEach(player => player.pause());
    else {
      const player = current();
      if (player.networkState === 3) player.load();
      void player.play().catch(() => {});
    }
  }
  for (const player of players) {
    player.addEventListener('timeupdate', onTime);
    player.addEventListener('ended', onEnded);
    player.addEventListener('error', onError, true);
  }
  motion.addEventListener('change', update);
  update();
  return () => {
    motion.removeEventListener('change', update);
    for (const player of players) {
      player.removeEventListener('timeupdate', onTime);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('error', onError, true);
      player.pause();
    }
  };
}
