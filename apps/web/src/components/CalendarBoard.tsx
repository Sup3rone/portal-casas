'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type Prop = { id: string; slug: string; title: string | null };
type Booking = { id?: string; propertyId: string; start: string; end: string; source: string; guestName: string | null; manualBlock: boolean; ownBlock: boolean };
const SOURCE_STYLE: Record<string, string> = {
  manual: 'bg-purple-600 text-white', airbnb: 'bg-rose-500 text-white', google: 'bg-blue-500 text-white',
  host: 'bg-amber-700 text-white', external: 'bg-gray-600 text-white',
};
export function isUnlockableBlock(booking: Booking) { return booking.source === 'host-block' && Boolean(booking.id); }
function origin(booking: Booking) { return booking.manualBlock || booking.source === 'host-block' ? 'host' : booking.source === 'manual' ? 'manual' : booking.source === 'airbnb' || booking.source === 'google' ? booking.source : 'external'; }
function iso(d: Date) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function bookingDelDia(bs: Booking[], id: string, day: string) { return bs.find(b=>b.propertyId===id && day>=b.start && day<b.end); }

export default function CalendarBoard({ propiedades, bookings, canSync = false }: { propiedades: Prop[]; bookings: Booking[]; canSync?: boolean }) {
  const t = useTranslations('occupationCalendar'), locale = useLocale(), router = useRouter();
  const [month, setMonth] = useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [selection, setSelection] = useState<{id:string;start:string;end:string}|null>(null);
  const [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  const [detail,setDetail] = useState<{id:string;day:string}|null>(null);
  const [removed,setRemoved] = useState<string[]>([]);
  const visibleBookings=bookings.filter(b=>b.source!=='host-block'||!b.id||!removed.includes(b.id));
  const formatDate=(day:string)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(day+'T12:00:00'));
  function description(booking:Booking) {
    const label=booking.manualBlock||booking.source==='host-block' ? t('hostOrigin') : booking.source==='manual' ? t('directOrigin') : t('externalOrigin');
    const guest=booking.source==='manual'&&!booking.manualBlock ? ' · '+t('reservedBy',{name:booking.guestName||t('unknownGuest')}) : '';
    const platform=booking.source==='airbnb'||booking.source==='google' ? ' · '+t(booking.source) : '';
    return label+guest+platform+' · '+t('range',{start:formatDate(booking.start),end:formatDate(booking.end)})+(isUnlockableBlock(booking)?'':' · '+t('readOnly'));
  }
  const year=month.getFullYear(), mes=month.getMonth();
  const offset=(month.getDay()+6)%7;
  const days:(Date|null)[]=[...Array(offset).fill(null),...Array.from({length:new Date(year,mes+1,0).getDate()},(_,i)=>new Date(year,mes,i+1))];
  const weekdays=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2024,0,1+i)));
  function choose(id:string, day:string) {
    setDetail(null);
    setMessage('');
    if (!selection || selection.id!==id || selection.end || day<=selection.start) { setSelection({id,start:day,end:''}); return; }
    if(visibleBookings.some(b=>b.propertyId===id && b.start<day && b.end>selection.start)){setMessage(t('occupied'));return;}
    setSelection({...selection,end:day});
  }
  async function save() {
    if(!selection?.end)return;
    setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/properties/'+encodeURIComponent(selection.id)+'/calendar-blocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({startDate:selection.start,endDate:selection.end})});
      if(!response.ok)throw new Error(t('error'));
      setSelection(null);setMessage(t('saved'));router.refresh();
    } catch(error){setMessage(error instanceof Error?error.message:t('error'));} finally{setBusy(false);}
  }
  async function sync() {
    setBusy(true);setMessage('');
    try{const response=await fetch('/api/ical/sync',{method:'POST'});if(!response.ok)throw new Error(t('error'));setMessage(t('synced'));router.refresh();}
    catch(error){setMessage(error instanceof Error?error.message:t('error'));}finally{setBusy(false);}
  }
  async function unlock(booking:Booking) {
    if(busy||!isUnlockableBlock(booking)||!window.confirm(t('unlockConfirm',{start:formatDate(booking.start),end:formatDate(booking.end)})))return;
    setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/properties/'+encodeURIComponent(booking.propertyId)+'/blocks/'+encodeURIComponent(booking.id!),{method:'DELETE'});
      if(!response.ok)throw new Error(t('unlockError'));
      setRemoved(current=>[...current,booking.id!]);setDetail(null);setMessage(t('unlocked'));router.refresh();
    } catch(error){setMessage(error instanceof Error?error.message:t('unlockError'));}finally{setBusy(false);}
  }
  return <div className="mx-auto max-w-5xl py-6 md:px-4">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">{t('title')}</h1>
      {canSync && <button onClick={sync} disabled={busy} className="min-h-11 rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t(busy?'syncing':'sync')}</button>}
    </div>
    <div className="mb-6 flex items-center justify-center gap-2 sm:gap-6">
      <button type="button" aria-label={t('previous')} onClick={()=>{setMonth(new Date(year,mes-1,1));}} className="h-11 w-11 shrink-0 rounded-lg border dark:border-gray-700">←</button>
      <h2 className="min-w-0 flex-1 text-center text-xl font-semibold capitalize">{new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(month)}</h2>
      <button type="button" aria-label={t('next')} onClick={()=>{setMonth(new Date(year,mes+1,1));}} className="h-11 w-11 shrink-0 rounded-lg border dark:border-gray-700">→</button>
    </div>
    <div className="mb-6 flex flex-wrap gap-4 text-xs">{Object.entries(SOURCE_STYLE).map(([source,style])=><span key={source} className="flex items-center gap-1"><span className={'inline-block h-3 w-3 rounded '+style}/>{t(source==='host'?'hostOrigin':source==='external'?'externalOrigin':source==='manual'?'directOrigin':source)}</span>)}</div>
    <p className="mb-4 text-sm">{t('hint')}</p>
    {message && <p role="status" className={message===t('unlocked')?'fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-xl border border-green-700 bg-white p-4 text-green-800 shadow-lg dark:border-green-400 dark:bg-gray-900 dark:text-green-300':'mb-4'}>{message}{message===t('unlocked')&&<button type="button" onClick={()=>setMessage('')} className="ml-3 min-h-11 underline">{t('dismissNotice')}</button>}</p>}
    <div className="space-y-10">{propiedades.map(p=><section key={p.id} className="min-w-0 rounded-2xl border bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <h3 className="mb-4 break-words text-lg font-bold">{p.title??p.slug}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">{weekdays.map(d=><div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{days.map((d,i)=>{
        if(!d)return <div key={'empty'+i}/>;
        const day=iso(d), booking=bookingDelDia(visibleBookings,p.id,day);
        const source=booking?origin(booking):undefined;
        const tooltip=booking ? description(booking) : t('free');
        const selected=selection?.id===p.id && day>=selection.start && day<=(selection.end||selection.start);
        return <button type="button" key={day} title={booking?undefined:tooltip} aria-label={day+' · '+tooltip} aria-pressed={selected} aria-disabled={busy}
          aria-describedby={booking&&detail?.id===p.id&&detail.day===day?'calendar-info-'+p.id:undefined}
          onMouseEnter={()=>{if(booking)setDetail({id:p.id,day});}}
          onFocus={()=>{if(booking)setDetail({id:p.id,day});}}
          onKeyDown={event=>{if(event.key==='Escape')setDetail(null);}}
          onClick={()=>{if(booking)setDetail({id:p.id,day});else if(!busy)choose(p.id,day);}}
          className={'flex h-11 min-w-0 items-center justify-center rounded-lg text-sm font-medium '+(booking?(SOURCE_STYLE[source||'']||'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100'):selected?'bg-green-700 text-white ring-2 ring-green-500':'bg-gray-50 text-gray-500 dark:bg-gray-950 dark:text-gray-300')}>{d.getDate()}</button>;
      })}</div>
      {detail?.id===p.id&&<div className="mt-4 min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-950" onKeyDown={event=>{if(event.key==='Escape')setDetail(null);}}>
        <div role="tooltip" id={'calendar-info-'+p.id} className="space-y-2 break-words">
          {visibleBookings.filter(b=>b.propertyId===p.id&&detail.day>=b.start&&detail.day<b.end).map((b,i)=><p key={b.id||i}>{description(b)}</p>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {visibleBookings.filter(b=>b.propertyId===p.id&&detail.day>=b.start&&detail.day<b.end&&isUnlockableBlock(b)).map(b=><button key={b.id} type="button" disabled={busy} onClick={()=>unlock(b)} className="min-h-11 rounded-full border border-green-700 px-4 text-green-800 disabled:opacity-50 dark:border-green-400 dark:text-green-300">{t(busy?'unlocking':'unlock')} · {formatDate(b.start)} → {formatDate(b.end)}</button>)}
          <button type="button" onClick={()=>setDetail(null)} className="min-h-11 px-3 underline">{t('closeDetails')}</button>
        </div>
      </div>}
      {selection?.id===p.id && <div className="mt-4 flex flex-wrap items-center gap-3"><span>{selection.start} → {selection.end||'…'}</span>
        <button type="button" disabled={busy||!selection.end} onClick={save} className="min-h-11 rounded-full bg-green-700 px-4 text-white disabled:opacity-50">{t(busy?'saving':'block')}</button>
        <button type="button" disabled={busy} onClick={()=>setSelection(null)} className="min-h-11 px-3 underline">{t('cancel')}</button></div>}
    </section>)}</div>
    {!propiedades.length&&<p>{t('empty')}</p>}
  </div>;
}
