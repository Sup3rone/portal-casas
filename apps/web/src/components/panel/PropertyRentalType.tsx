'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PanelProperty } from '@/lib/panel-resources';

type RentalType = PanelProperty['rentalType'];
const RentalTypeContext = createContext<{ rentalType: RentalType; setRentalType: (value: RentalType) => void } | null>(null);
export function usePropertyRentalType() { return useContext(RentalTypeContext); }

export default function PropertyRentalType({ initial, children }: { initial: RentalType; children: ReactNode }) {
  const [rentalType, setRentalType] = useState(initial);
  return <RentalTypeContext.Provider value={{ rentalType, setRentalType }}>{children}</RentalTypeContext.Provider>;
}

export function RentalTypeResources({ children }: { children: ReactNode }) {
  const state = usePropertyRentalType();
  // Mantener montados los editores conserva sus borradores al alternar el selector.
  return <div hidden={state?.rentalType === 'anual'} className="space-y-8">{children}</div>;
}
