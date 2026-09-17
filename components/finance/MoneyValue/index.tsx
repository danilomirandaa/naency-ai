import { Text, type TextSize } from '@/components/ui/Text';
import { formatMoney } from '@/lib/money';
import { classMerge } from '@/lib/utils';

export type MoneyKind = 'income' | 'expense' | 'transfer' | 'neutral';

const kindClassName: Record<MoneyKind, string> = {
  income: 'text-typography-finance-income',
  expense: 'text-typography-finance-expense',
  transfer: 'text-typography-finance-transfer',
  neutral: 'text-typography-neutral-primary',
};

export type MoneyValueProps = {
  /** Valor em centavos, com sinal (saída negativa). */
  cents: number;
  /** Cor pelo tipo. Sem `kind`, vermelho para negativo e neutro para o resto. */
  kind?: MoneyKind;
  /** Mostra "+" em valores positivos (listas de lançamentos). */
  showPlusSign?: boolean;
  size?: TextSize;
  weight?: 'normal' | 'medium' | 'semibold';
  currency?: string;
  className?: string;
};

/** Único jeito de exibir dinheiro na interface (docs/components.md). */
export function MoneyValue({
  cents,
  kind,
  showPlusSign = false,
  size = 'inherit',
  weight = 'medium',
  currency,
  className,
}: MoneyValueProps) {
  const resolvedKind = kind ?? (cents < 0 ? 'expense' : 'neutral');
  return (
    <Text
      size={size}
      weight={weight}
      className={classMerge('whitespace-nowrap tabular-nums', kindClassName[resolvedKind], className)}
    >
      {formatMoney(cents, { currency, signDisplay: showPlusSign ? 'exceptZero' : 'auto' })}
    </Text>
  );
}
