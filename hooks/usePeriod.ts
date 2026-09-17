'use client';

import { type DateRange, PERIOD_COOKIE, rangeParams, resolveRange, serializeRange } from '@/lib/periods';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Período das telas que dependem dele: lê da URL (ou do cookie que o servidor
 * passou) e, ao mudar, grava o cookie e troca os parâmetros da página atual.
 */
export function usePeriod(periodCookie: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = resolveRange(searchParams, periodCookie);

  const setRange = (next: DateRange) => {
    document.cookie = `${PERIOD_COOKIE}=${serializeRange(next)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ['mes', 'de', 'ate', 'pagina']) {
      params.delete(key);
    }
    for (const [key, value] of Object.entries(rangeParams(next))) {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return { range, setRange };
}
