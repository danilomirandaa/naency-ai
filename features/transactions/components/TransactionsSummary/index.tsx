import type { MoneyValueProps } from '@/components/finance/MoneyValue';
import { StatCard, type StatTone } from '@/components/finance/StatCard';
import type { Icons } from '@/components/ui/Icon';
import type { TransactionsPage } from '@/features/transactions/types';
import type { TransactionKind } from '@/lib/transactions';

export type TransactionsSummaryProps = {
  /** Página de despesas ou receitas mostra por situação; sem tipo, receitas × despesas. */
  kind: TransactionKind | null;
  totals: TransactionsPage['totals'];
  isLoading?: boolean;
};

type Card = {
  label: string;
  icon: Icons;
  tone: StatTone;
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

/**
 * Resumo do topo da página de lançamentos. Em despesas e receitas: pendentes,
 * pagas e total do período, com quantidades; em "Todas": receitas, despesas e
 * resultado. Valores do período inteiro, sem transferências.
 */
export function TransactionsSummary({ kind, totals, isLoading = false }: TransactionsSummaryProps) {
  return (
    <StatCard.Group>
      {cardsFor(kind, totals).map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          icon={card.icon}
          tone={card.tone}
          cents={card.cents}
          moneyKind={card.moneyKind}
          valueClassName={card.valueClassName}
          showPlusSign={card.showPlusSign}
          detail={card.detail}
          isLoading={isLoading}
        />
      ))}
    </StatCard.Group>
  );
}
