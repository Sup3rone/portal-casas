'use client';
import { createContext, useContext, type ReactNode } from 'react';

type Contacts = { social_instagram: string; social_facebook: string; contact_whatsapp: string };
const FooterContacts = createContext<Contacts>({ social_instagram: '', social_facebook: '', contact_whatsapp: '' });
export function useFooterContacts() { return useContext(FooterContacts); }
export default function FooterContactsProvider({ value, children }: { value: Contacts; children: ReactNode }) {
  return <FooterContacts.Provider value={value}>{children}</FooterContacts.Provider>;
}

// Agrupación visual, sin deducir país: últimos ocho dígitos en dos grupos de cuatro.
export function formatContactWhatsapp(number: string) {
  const tail = number.slice(-8), prefix = number.slice(0, -8).match(/.{1,3}/g) || [];
  return '+' + [...prefix, tail.slice(0, 4), tail.slice(4)].join(' ');
}
