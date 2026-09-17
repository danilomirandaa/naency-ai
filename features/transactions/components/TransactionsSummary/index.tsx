import { MoneyValue } from '@/components/finance/MoneyValue';
import { Panel } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';

export type TransactionsSummaryProps = {
  /** Soma das receitas (positiva). */
  incomeCents: number;
  /** Soma das despesas (negativa). */
  expenseCents: number;
  isLoading?: boolean;
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 bg-background-neutral-000 px-4 py-3">
      <dt>
        <Text size="xs" color="secondary">
          {label}
        </Text>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Receitas, despesas e resultado do período filtrado (sem transferências). */
export function TransactionsSummary({ incomeCents, expenseCents, isLoading = false }: TransactionsSummaryProps) {
  const result = incomeCents + expenseCents;
  const value = (content: React.ReactNode) =>
    isLoading ? <Skeleton className="h-6 w-24" /> : content;

  return (
    <Panel.Root>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[inherit] bg-border-neutral-subtle sm:grid-cols-3">
        <Stat label="Receitas">
          {value(<MoneyValue cents={incomeCents} kind="income" size="lg" weight="semibold" className="tabular-nums" />)}
        </Stat>
        <Stat label="Despesas">
          {value(<MoneyValue cents={expenseCents} kind="expense" size="lg" weight="semibold" className="tabular-nums" />)}
        </Stat>
        <Stat label="Resultado">
          {value(
            <MoneyValue
              cents={result}
              kind={result < 0 ? 'expense' : 'neutral'}
              showPlusSign={result > 0}
              size="lg"
              weight="semibold"
              className="tabular-nums"
            />,
          )}
        </Stat>
      </dl>
    </Panel.Root>
  );
}
