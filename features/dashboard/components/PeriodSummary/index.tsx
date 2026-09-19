import { StatCard } from '@/components/finance/StatCard';
import type { BalanceData, MonthResultData } from '@/features/dashboard/types';
import { wholeMonthOf } from '@/lib/periods';

export type PeriodSummaryProps = {
  result: MonthResultData | undefined;
  /** Sem o saldo (ex.: em Relatórios, que é só sobre o período), são três cards. */
  balances?: BalanceData | undefined;
  withBalance?: boolean;
  /** Links para a lista por trás de cada número. */
  transactionsHref?: (kind: 'income' | 'expense' | null) => string;
  isLoading?: boolean;
};

/**
 * Variação em porcentagem sobre o período anterior. `null` quando não há com o
 * que comparar — sem base, "+100%" não quer dizer nada.
 */
export function percentChange(current: number, previous: number) {
  const before = Math.abs(previous);
  if (before === 0) {
    return null;
  }
  return Math.round(((Math.abs(current) - before) / before) * 100);
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * A faixa do topo da visão geral: quanto tem, quanto entrou, quanto saiu e o
 * que sobrou — nessa ordem, porque é a ordem em que a pergunta aparece. Cada
 * número do período traz a variação sobre o anterior.
 */
export function PeriodSummary({
  result,
  balances,
  withBalance = true,
  transactionsHref,
  isLoading = false,
}: PeriodSummaryProps) {
  const income = result?.current.incomeCents ?? 0;
  const expense = result?.current.expenseCents ?? 0;
  const net = income + expense;
  const comparedTo = result && wholeMonthOf(result.range) ? 'vs. mês anterior' : 'vs. período anterior';
  const incomeChange = result ? percentChange(income, result.previous.incomeCents) : null;
  const expenseChange = result ? percentChange(expense, result.previous.expenseCents) : null;
  const accountCount = balances?.accounts.filter((account) => account.type !== 'credit_card').length ?? 0;

  return (
    <StatCard.Group columns={withBalance ? 4 : 3}>
      {withBalance && (
        <StatCard
          label="Saldo em contas"
          icon="wallet"
          tone="neutral"
          cents={balances?.availableCents ?? 0}
          moneyKind={(balances?.availableCents ?? 0) < 0 ? 'expense' : 'neutral'}
          detail={accountCount > 0 ? plural(accountCount, 'conta', 'contas') : undefined}
          href="/contas"
          isLoading={isLoading}
        />
      )}
      <StatCard
        label="Receitas"
        icon="income"
        tone="income"
        cents={income}
        moneyKind="income"
        trend={incomeChange === null ? undefined : { percent: incomeChange, comparedTo, upIs: 'good' }}
        href={transactionsHref?.('income')}
        isLoading={isLoading}
      />
      <StatCard
        label="Despesas"
        icon="expense"
        tone="expense"
        cents={expense}
        moneyKind="expense"
        trend={expenseChange === null ? undefined : { percent: expenseChange, comparedTo, upIs: 'bad' }}
        href={transactionsHref?.('expense')}
        isLoading={isLoading}
      />
      <StatCard
        label="Resultado"
        icon="reports"
        // Sobrou é verde, faltou é vermelho: o valor não fica sem cor ao lado dos outros.
        tone={net < 0 ? 'expense' : 'income'}
        cents={net}
        moneyKind={net < 0 ? 'expense' : 'income'}
        showPlusSign={net > 0}
        detail={net < 0 ? 'Gastou mais do que entrou' : 'Entrou mais do que saiu'}
        href={transactionsHref?.(null)}
        isLoading={isLoading}
      />
    </StatCard.Group>
  );
}
