'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getSession, SessionProvider } from 'next-auth/react';

function SessionRefresh() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    // Las Server Actions cambian la cookie sin avisar al provider persistente.
    if (from !== pathname && /\/(login|registro|mi-cuenta)\/?$/.test(from || '')) {
      void getSession();
    }
  }, [pathname]);
  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider><SessionRefresh />{children}</SessionProvider>;
}
