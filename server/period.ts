import 'server-only';
import { type DateRange, PERIOD_COOKIE, resolveRange } from '@/lib/periods';
import { cookies } from 'next/headers';

type SearchParams = Record<string, string | string[] | undefined>;

/** Cookie do período escolhido no header (ou `null`). */
export async function getPeriodCookie() {
  return (await cookies()).get(PERIOD_COOKIE)?.value ?? null;
}

/** Período da página no servidor: URL → cookie → mês atual (mesma regra do cliente). */
export async function getPagePeriod(searchParams: SearchParams): Promise<{ range: DateRange; cookie: string | null }> {
  const cookie = await getPeriodCookie();
  const range = resolveRange(
    { get: (name) => (typeof searchParams[name] === 'string' ? (searchParams[name] as string) : null) },
    cookie,
  );
  return { range, cookie };
}
