'use client';
// T-4944: /unete como cuestionario a pantalla completa. Una pregunta por pantalla; elegir una opción avanza.
// Teclado: A/B/C… o 1/2/3… eligen; Atrás y las respuestas del resumen regresan. Las respuestas viven en el hash
// (lib/join-quiz.ts), así que el Atrás del navegador también funciona. Al final: resumen, beneficios y la acción.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import WhatsappCta from './WhatsappCta';
import { unoptimizedFor } from '@/lib/image-src';
import { whatsappHref } from '@/lib/public-pages';
import { fillPageText } from '@/lib/page-content';
import { OTHER_LOCATION, answerSummary, isComplete, optionIndexForKey, optionKey, parseHash, stepsFor, toHash, totalSteps, type Step } from '@/lib/join-quiz';
import styles from './JoinQuiz.module.css';

type Props = { states: string[]; whatsapp: string; signedIn: boolean; image?: string; texts?: Record<string, string> };
const benefitKeys = ['one', 'two', 'three'] as const;
const primaryClass = 'inline-flex min-h-11 items-center justify-center rounded-full bg-green-700 px-6 py-3 text-sm font-medium tracking-wide text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:bg-green-600 dark:hover:bg-green-500';

export default function JoinQuiz({ states, whatsapp, signedIn, image, texts = {} }: Props) {
  const messages = useTranslations('join');
  // Panel → Contenido → Páginas manda; lo vacío cae a messages/*.json.
  const t = (key: string, params?: Record<string, string | number>) => {
    const edited = texts[`join.${key}`];
    return edited ? fillPageText(edited, params) : messages(key as Parameters<typeof messages>[0], params);
  };
  const [answers, setAnswers] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // El hash manda: al cargar (enlace directo) y con Atrás/Adelante del navegador.
  useEffect(() => {
    const sync = () => setAnswers(parseHash(window.location.hash, states));
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, [states]);

  // Cada pantalla nueva lleva el foco a su pregunta: el lector de pantalla la anuncia y Tab sigue desde ahí.
  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
  }, [answers]);

  const go = useCallback((next: string[]) => {
    moved.current = true;
    window.history.pushState(null, '', window.location.pathname + window.location.search + toHash(next));
    setAnswers(next);
  }, []);

  const steps = stepsFor(answers[0], states);
  const complete = isComplete(answers, states);
  const step: Step | undefined = complete ? undefined : steps[answers.length];
  const total = totalSteps(answers, states);
  const current = complete ? total : answers.length + 1;
  const audience = answers[0] as 'owners' | 'referrers' | undefined;

  const choose = useCallback((value: string) => {
    if (chosen) return;
    setChosen(value);
    // Un instante con la opción marcada para que se vea lo elegido; sin espera con reduced-motion.
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    window.setTimeout(() => { setChosen(null); go([...answers, value]); }, delay);
  }, [answers, chosen, go]);

  useEffect(() => {
    if (!step) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
      const index = optionIndexForKey(event.key, step.options.length);
      if (index >= 0) { event.preventDefault(); choose(step.options[index]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, choose]);

  const label = (id: Step['id'], value: string) => {
    if (id === 'audience') return t(`${value as 'owners' | 'referrers'}.cardTitle`);
    if (id === 'location' && value !== OTHER_LOCATION) return value;
    return t(`quiz.${id}.options.${value}`);
  };
  const summary = complete ? answerSummary(steps, answers, label, id => t(`quiz.${id}.short`)) : '';
  const contactReady = Boolean(whatsappHref(whatsapp, 'x'));

  return (
    <div className="flex min-h-0 w-full flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 pt-5 sm:px-8">
          <button type="button" onClick={() => go(answers.slice(0, -1))} aria-hidden={answers.length === 0} tabIndex={answers.length === 0 ? -1 : undefined}
            className={`${styles.back} -ml-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-gray-600 hover:text-[var(--brand-brown)] focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-300 dark:hover:text-[var(--brand-brown-light)]${answers.length === 0 ? ' invisible' : ''}`}>
            <span aria-hidden="true">←</span>{t('back')}
          </button>
          <p aria-live="polite" className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-gray-300">
            {complete ? t('doneLabel') : t('progress', { current, total })}
          </p>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 sm:px-8">
          <div className="h-0.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/15">
            <div data-progress={current + '/' + total} className={`h-full bg-[var(--brand-brown)] dark:bg-[var(--brand-brown-light)] ${styles.bar}`} style={{ width: `${(complete ? 1 : answers.length / total) * 100}%` }} />
          </div>
        </div>
        {/* Sin scroll de página; solo en pantallas muy bajas este bloque se desplaza por dentro. */}
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div key={answers.join('/') || 'start'} className={`m-auto w-full max-w-3xl px-4 py-6 sm:px-8 [@media(max-height:720px)]:py-3 ${styles.step}`}>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 [@media(max-height:720px)]:hidden">{t('heroEyebrow')}</p>
            {step ? <>
              <h1 ref={heading} tabIndex={-1} id="join-question" className="break-words text-2xl font-light leading-snug tracking-[0.06em] outline-none sm:text-4xl">{t(`quiz.${step.id}.title`)}</h1>
              <p className="mt-3 break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t(`quiz.${step.id}.help`)}</p>
              <div role="group" aria-labelledby="join-question" className={`mt-7 grid gap-3 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:gap-2 ${step.id === 'audience' || step.options.length > 4 ? 'sm:grid-cols-2' : 'max-w-xl'}`}>
                {step.options.map((value, index) => <button key={value} type="button" data-option={value} aria-keyshortcuts={optionKey(index)} onClick={() => choose(value)}
                  style={{ '--i': index } as CSSProperties}
                  className={`${styles.option}${chosen === value ? ' ' + styles.chosen : ''} group flex min-h-14 w-full items-center [@media(max-height:720px)]:min-h-12 [@media(max-height:720px)]:py-2 gap-4 rounded-2xl border border-gray-300 bg-white/70 px-4 py-3 text-left hover:border-[var(--brand-brown)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-white/15 dark:bg-white/5 dark:hover:border-[var(--brand-brown-light)]`}>
                  <span aria-hidden="true" className={`${styles.key} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-xs font-medium dark:border-white/20`}>{optionKey(index)}</span>
                  <span className="min-w-0">
                    <span className="block break-words font-medium">{label(step.id, value)}</span>
                    {step.id === 'audience' && <span className="mt-1 block break-words text-sm text-gray-600 dark:text-gray-300">{t(`${value as 'owners' | 'referrers'}.cardText`)}</span>}
                  </span>
                </button>)}
              </div>
              <p className="mt-6 hidden text-xs text-gray-500 sm:block dark:text-gray-400">{t('keyHint')}</p>
            </> : audience && <>
              <h1 ref={heading} tabIndex={-1} className="break-words text-2xl font-light leading-snug tracking-[0.06em] outline-none sm:text-4xl">{t(`${audience}.doneTitle`)}</h1>
              <p className="mt-3 break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t(`${audience}.doneText`)}</p>
              <ul aria-label={t('summaryLabel')} className="mt-5 flex flex-wrap gap-2 [@media(max-height:720px)]:mt-3">
                {steps.map((item, index) => <li key={item.id}>
                  <button type="button" onClick={() => go(answers.slice(0, index))} aria-label={t('editAnswer', { answer: label(item.id, answers[index]) })}
                    className={`${styles.chip} inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 px-4 text-sm hover:border-[var(--brand-brown)] focus-visible:outline-2 focus-visible:outline-green-700 dark:border-white/20 dark:hover:border-[var(--brand-brown-light)]`}>
                    {label(item.id, answers[index])}<span aria-hidden="true" className="text-gray-400">✎</span>
                  </button>
                </li>)}
              </ul>
              <ul className="mt-5 grid gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
                {benefitKeys.map(key => <li key={key} className="flex gap-2 sm:block sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white/70 sm:p-4 sm:dark:border-white/15 sm:dark:bg-white/5">
                  <span aria-hidden="true" className="text-[var(--brand-brown)] sm:hidden dark:text-[var(--brand-brown-light)]">✓</span>
                  <p className="break-words text-sm font-medium">{t(`${audience}.benefits.${key}.title`)}</p>
                  <p className="mt-1 hidden break-words text-xs leading-relaxed text-gray-600 sm:block dark:text-gray-300">{t(`${audience}.benefits.${key}.text`)}</p>
                </li>)}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 [@media(max-height:720px)]:mt-5">
                {audience === 'referrers' && !signedIn
                  ? <Link href="/registro" data-cta="registro" className={`${styles.cta} ${primaryClass}`}>{t('referrers.ctaRegister')}</Link>
                  : <WhatsappCta number={whatsapp} message={t(`${audience}.whatsappMessage`, { summary })} label={t(`${audience}.cta`)} />}
                <button type="button" onClick={() => go([])} className="inline-flex min-h-11 items-center text-sm text-gray-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-300">{t('restart')}</button>
              </div>
              {audience === 'referrers' && !signedIn && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t('referrers.ctaRegisterHint')}</p>}
              {(audience === 'owners' || signedIn) && !contactReady && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t('contactMissing')}</p>}
            </>}
          </div>
        </div>
      </div>
      {image && <div className="relative hidden w-[38%] max-w-2xl shrink-0 overflow-hidden lg:block">
        <Image src={image} alt="" fill priority unoptimized={unoptimizedFor(image)} sizes="38vw" className={`object-cover ${styles.photo}`} />
      </div>}
    </div>
  );
}
