import { MoneyValue } from '@/components/finance/MoneyValue';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';

export type LimitUsageProps = {
  /** Limite total em centavos. */
  limitCents: number;
  /** Quanto está usado (positivo). */
  usedCents: number;
  className?: string;
};

/** Barra de uso do limite do cartão: usado e disponível. */
export function LimitUsage({ limitCents, usedCents, className }: LimitUsageProps) {
  const used = Math.max(0, usedCents);
  const ratio = limitCents > 0 ? Math.min(1, used / limitCents) : 1;
  const available = limitCents - used;
  const percent = Math.round(ratio * 100);
  const tone = ratio >= 0.9 ? 'bg-background-status-critical-rest' : ratio >= 0.7 ? 'bg-background-status-warning-rest' : 'bg-button-brand-primary-rest';

  return (
    <div className={classMerge('flex flex-col gap-1.5', className)}>
      <div
        role="meter"
        aria-label="Limite usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% do limite usado`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-background-neutral-200"
      >
        <div className={classMerge('h-full rounded-full transition-[width]', tone)} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Text size="xs" color="secondary">
          Disponível <MoneyValue cents={available} size="xs" kind={available < 0 ? 'expense' : 'neutral'} />
        </Text>
        <Text size="xs" color="secondary">
          Limite <MoneyValue cents={limitCents} size="xs" kind="neutral" weight="normal" />
        </Text>
      </div>
    </div>
  );
}
