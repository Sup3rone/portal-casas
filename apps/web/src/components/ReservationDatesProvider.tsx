'use client';

import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { ReservationDates } from '@/lib/reservationDates';

const ReservationDatesContext = createContext<{
  dates: ReservationDates;
  setDates: Dispatch<SetStateAction<ReservationDates>>;
} | null>(null);

export default function ReservationDatesProvider({ children }: { children: ReactNode }) {
  const [dates, setDates] = useState<ReservationDates>({ startDate: '', endDate: '' });
  return (
    <ReservationDatesContext.Provider value={{ dates, setDates }}>
      {children}
    </ReservationDatesContext.Provider>
  );
}

export function useReservationDates() {
  const context = useContext(ReservationDatesContext);
  if (!context) throw new Error('Falta ReservationDatesProvider');
  return context;
}
