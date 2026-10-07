import CalendarBoard from '@/components/CalendarBoard';
import { requireAdmin } from '@/lib/property-access';
import { occupationCalendar } from '@/lib/occupation-calendar';

export const dynamic = 'force-dynamic';
export default async function AdminCalendarioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const manager = await requireAdmin();
  return <CalendarBoard {...await occupationCalendar(manager, locale)} canSync />;
}
