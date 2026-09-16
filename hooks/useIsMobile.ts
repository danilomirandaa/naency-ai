'use client';

import { useSyncExternalStore } from 'react';

/** Mesmo corte do breakpoint `md` do Tailwind. */
const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
