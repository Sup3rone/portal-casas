import CalendarBoard from '@/components/CalendarBoard';
import { panelManager } from '@/lib/panel-server';
import { occupationCalendar } from '@/lib/occupation-calendar';

export const dynamic = 'force-dynamic';
export default async function PanelCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  return <CalendarBoard {...await occupationCalendar(manager, locale)} canSync={manager.role === 'ADMIN'} />;
}
