import 'server-only';
import { createHash } from 'node:crypto';
import { normalizeDescription } from '@/lib/transactions';

type FingerprintInput = {
  accountId: string;
  date: string;
  amountCents: number;
  description: string;
};

/**
 * Impressão digital de um lançamento para deduplicar importações (docs/domain.md):
 * conta, data, valor, descrição normalizada e a ordem da ocorrência no dia (duas
 * compras iguais no mesmo dia não se confundem).
 */
export function fingerprintOf(input: FingerprintInput, occurrence: number) {
  return createHash('sha256')
    .update(
      [input.accountId, input.date, input.amountCents, normalizeDescription(input.description), occurrence].join('|'),
    )
    .digest('hex');
}

/** Impressões de uma lista, numerando ocorrências iguais na ordem em que aparecem. */
export function fingerprintAll<T extends FingerprintInput>(items: T[]) {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const key = [item.accountId, item.date, item.amountCents, normalizeDescription(item.description)].join('|');
    const occurrence = (seen.get(key) ?? 0) + 1;
    seen.set(key, occurrence);
    return fingerprintOf(item, occurrence);
  });
}
