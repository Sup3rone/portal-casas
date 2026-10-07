'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type Prop = { id: string; slug: string; title: string | null };
type Booking = { propertyId: string; start: string; end: string; source: string; guestName: string | null; manualBlock: boolean; ownBlock: boolean };
const SOURCE_STYLE: Record<string, string> = {
  manual: 'bg-purple-600 text-white', airbnb: 'bg-rose-500 text-white', google: 'bg-blue-500 text-white',
};
function iso(d: Date) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function bookingDelDia(bs: Booking[], id: string, day: string) { return bs.find(b=>b.propertyId===id && day>=b.start && day<b.end); }

export default function CalendarBoard({ propiedades, bookings, canSync = false }: { propiedades: Prop[]; bookings: Booking[]; canSync?: boolean }) {
  const t = useTranslations('occupationCalendar'), locale = useLocale(), router = useRouter();
  const [month, setMonth] = useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [selection, setSelection] = useState<{id:string;start:string;end:string}|null>(null);
  const [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  const year=month.getFullYear(), mes=month.getMonth();
  const offset=(month.getDay()+6)%7;
  const days:(Date|null)[]=[...Array(offset).fill(null),...Array.from({length:new Date(year,mes+1,0).getDate()},(_,i)=>new Date(year,mes,i+1))];
  const weekdays=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2024,0,1+i)));
  function choose(id:string, day:string) {
    setMessage('');
    if (!selection || selection.id!==id || selection.end || day<=selection.start) { setSelection({id,start:day,end:''}); return; }
    if(bookings.some(b=>b.propertyId===id && b.start<day && b.end>selection.start)){setMessage(t('occupied'));return;}
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
  return <div className="mx-auto max-w-5xl py-6 md:px-4">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">{t('title')}</h1>
      {canSync && <button onClick={sync} disabled={busy} className="min-h-11 rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t(busy?'syncing':'sync')}</button>}
    </div>
    <div className="mb-6 flex items-center justify-center gap-2 sm:gap-6">
      <button type="button" aria-label={t('previous')} onClick={()=>{setMonth(new Date(year,mes-1,1));}} className="h-11 w-11 shrink-0 rounded-lg border dark:border-gray-700">←</button>
      <h2 className="min-w-0 flex-1 text-center text-xl font-semibold capitalize">{new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(month)}</h2>
      <button type="button" aria-label={t('next')} onClick={()=>{setMonth(new Date(year,mes+1,1));}} className="h-11 w-11 shrink-0 rounded-lg border dark:border-gray-700">→</button>
    </div>
    <div className="mb-6 flex flex-wrap gap-4 text-xs">{Object.entries(SOURCE_STYLE).map(([source,style])=><span key={source} className="flex items-center gap-1"><span className={'inline-block h-3 w-3 rounded '+style}/>{t(source)}</span>)}</div>
    <p className="mb-4 text-sm">{t('hint')}</p>
    {message && <p role="status" className="mb-4">{message}</p>}
    <div className="space-y-10">{propiedades.map(p=><section key={p.id} className="min-w-0 rounded-2xl border bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <h3 className="mb-4 break-words text-lg font-bold">{p.title??p.slug}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">{weekdays.map(d=><div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{days.map((d,i)=>{
        if(!d)return <div key={'empty'+i}/>;
        const day=iso(d), booking=bookingDelDia(bookings,p.id,day);
        const source=booking?.source==='host-block'?'manual':booking?.source;
        const tooltip=booking ? booking.manualBlock ? t(booking.ownBlock?'blockedByYou':'blocked') : t('reservedBy',{name:booking.guestName||t('unknownGuest')}) : t('free');
        const selected=selection?.id===p.id && day>=selection.start && day<=(selection.end||selection.start);
        return <button type="button" key={day} title={tooltip} aria-label={day+' · '+tooltip} aria-pressed={selected} aria-disabled={Boolean(booking)||busy}
          onClick={()=>{if(!booking&&!busy)choose(p.id,day);}}
          className={'flex h-11 min-w-0 items-center justify-center rounded-lg text-sm font-medium '+(booking?(SOURCE_STYLE[source||'']||'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100'):selected?'bg-green-700 text-white ring-2 ring-green-500':'bg-gray-50 text-gray-500 dark:bg-gray-950 dark:text-gray-300')}>{d.getDate()}</button>;
      })}</div>
      {selection?.id===p.id && <div className="mt-4 flex flex-wrap items-center gap-3"><span>{selection.start} → {selection.end||'…'}</span>
        <button type="button" disabled={busy||!selection.end} onClick={save} className="min-h-11 rounded-full bg-green-700 px-4 text-white disabled:opacity-50">{t(busy?'saving':'block')}</button>
        <button type="button" disabled={busy} onClick={()=>setSelection(null)} className="min-h-11 px-3 underline">{t('cancel')}</button></div>}
    </section>)}</div>
    {!propiedades.length&&<p>{t('empty')}</p>}
  </div>;
}
