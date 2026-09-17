import { MoneyValue } from '@/components/finance/MoneyValue';
import { Meter } from '@/components/ui/Meter';
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
  const available = limitCents - used;
  const percent = limitCents > 0 ? Math.min(100, Math.round((used / limitCents) * 100)) : 100;

  return (
    <div className={classMerge('flex flex-col gap-1.5', className)}>
      <Meter label="Limite usado" value={used} max={limitCents} valueText={`${percent}% do limite usado`} />
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
