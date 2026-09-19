import { MoneyValue, type MoneyValueProps } from '@/components/finance/MoneyValue';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import type { TransactionsPage } from '@/features/transactions/types';
import type { TransactionKind } from '@/lib/transactions';
import { classMerge } from '@/lib/utils';

export type TransactionsSummaryProps = {
  /** Página de despesas ou receitas mostra por situação; sem tipo, receitas × despesas. */
  kind: TransactionKind | null;
  totals: TransactionsPage['totals'];
  isLoading?: boolean;
};

type Tone = 'warning' | 'income' | 'expense' | 'neutral';

// Cor sutil: fundo do ícone com 12% da cor.
const TONE_CLASSES: Record<Tone, string> = {
  warning: 'bg-icon-status-warning-rest/12 text-icon-status-warning-rest',
  income: 'bg-icon-finance-income/12 text-icon-finance-income',
  expense: 'bg-icon-finance-expense/12 text-icon-finance-expense',
  neutral: 'bg-background-neutral-100 text-icon-neutral-rest',
};

type Card = {
  label: string;
  icon: Icons;
  tone: Tone;
  cents: number;
  moneyKind: MoneyValueProps['kind'];
  /** Cor do valor quando não é a do tipo (ex.: pendente em amarelo). */
  valueClassName?: string;
  showPlusSign?: boolean;
  detail?: string;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function cardsFor(kind: TransactionKind | null, totals: TransactionsPage['totals']): Card[] {
  const { pending, paid } = totals;
  const all = pending.count + paid.count;
  if (kind === 'expense') {
    return [
      {
        label: 'A pagar',
        icon: 'clock',
        tone: 'warning',
        cents: Math.abs(pending.cents),
        moneyKind: 'neutral',
        valueClassName: 'text-typography-status-warning-rest',
        detail: plural(pending.count, 'despesa pendente', 'despesas pendentes'),
      },
      {
        label: 'Pagas',
        icon: 'check',
        tone: 'income',
        cents: Math.abs(paid.cents),
        moneyKind: 'income',
        detail: plural(paid.count, 'despesa paga', 'despesas pagas'),
      },
      {
        label: 'Total de despesas',
        icon: 'expense',
        tone: 'expense',
        cents: Math.abs(pending.cents + paid.cents),
        moneyKind: 'expense',
        detail: plural(all, 'despesa no período', 'despesas no período'),
      },
    ];
  }
  if (kind === 'income') {
    return [
      {
        label: 'A receber',
        icon: 'clock',
        tone: 'warning',
        cents: pending.cents,
        moneyKind: 'neutral',
        valueClassName: 'text-typography-status-warning-rest',
        detail: plural(pending.count, 'receita pendente', 'receitas pendentes'),
      },
      {
        label: 'Recebidas',
        icon: 'check',
        tone: 'income',
        cents: paid.cents,
        moneyKind: 'income',
        detail: plural(paid.count, 'receita recebida', 'receitas recebidas'),
      },
      {
        label: 'Total de receitas',
        icon: 'income',
        tone: 'income',
        cents: pending.cents + paid.cents,
        moneyKind: 'income',
        detail: plural(all, 'receita no período', 'receitas no período'),
      },
    ];
  }
  const result = totals.incomeCents + totals.expenseCents;
  return [
    {
      label: 'Receitas',
      icon: 'income',
      tone: 'income',
      cents: totals.incomeCents,
      moneyKind: 'income',
    },
    {
      label: 'Despesas',
      icon: 'expense',
      tone: 'expense',
      cents: totals.expenseCents,
      moneyKind: 'expense',
    },
    {
      label: 'Resultado',
      icon: 'wallet',
      // Sobrou é verde, faltou é vermelho: o valor não fica sem cor ao lado dos outros.
      tone: result < 0 ? 'expense' : 'income',
      cents: result,
      moneyKind: result < 0 ? 'expense' : 'income',
      showPlusSign: result > 0,
    },
  ];
}

function Stat({ card, isLoading }: { card: Card; isLoading: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 bg-background-neutral-000 px-4 py-3">
      <dl className="flex min-w-0 flex-col gap-1">
        <dt>
          <Text size="xs" color="secondary">
            {card.label}
          </Text>
        </dt>
        <dd className="flex flex-col gap-0.5">
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <MoneyValue
              cents={card.cents}
              kind={card.moneyKind}
              showPlusSign={card.showPlusSign}
              size="lg"
              weight="semibold"
              className={classMerge('tabular-nums', card.valueClassName)}
            />
          )}
          {card.detail && !isLoading && (
            <Text size="xs" color="secondary">
              {card.detail}
            </Text>
          )}
        </dd>
      </dl>
      <span
        aria-hidden
        className={classMerge(
          'flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5',
          TONE_CLASSES[card.tone],
        )}
      >
        <Icon icon={card.icon} />
      </span>
    </div>
  );
}

/**
 * Resumo do topo da página de lançamentos. Em despesas e receitas: pendentes,
 * pagas e total do período, com quantidades; em "Todas": receitas, despesas e
 * resultado. Valores do período inteiro, sem transferências.
 */
export function TransactionsSummary({ kind, totals, isLoading = false }: TransactionsSummaryProps) {
  return (
    <Panel.Root>
      <Panel.Body className="grid grid-cols-1 gap-px bg-border-neutral-subtle sm:grid-cols-3">
        {cardsFor(kind, totals).map((card) => (
          <Stat key={card.label} card={card} isLoading={isLoading} />
        ))}
      </Panel.Body>
    </Panel.Root>
  );
}
