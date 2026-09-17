import { MoneyValue } from '@/components/finance/MoneyValue';
import { MemberAvatar } from '@/components/finance/MemberAvatar';
import { Button } from '@/components/ui/Button';
import { List } from '@/components/ui/List';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { RecentTransaction } from '@/features/dashboard/types';
import { formatIsoDate } from '@/lib/dates';
import Link from 'next/link';

export type RecentTransactionsProps = {
  data: RecentTransaction[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
};

/** "O que mudou?": últimos lançamentos e quem lançou. */
export function RecentTransactions({ data, isLoading, isError }: RecentTransactionsProps) {
  const items = data ?? [];
  return (
    <DashboardCard
      title="Últimos lançamentos"
      action={
        items.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/transacoes">Ver todos</Link>
          </Button>
        )
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      emptyIcon="transactions"
      emptyMessage="Nenhum lançamento ainda"
      emptyAction={
        <Button asChild variant="outline">
          <Link href="/importar">Importar um extrato</Link>
        </Button>
      }
    >
      <List.Root aria-label="Últimos lançamentos">
        {items.map((item) => (
          <List.Item key={item.id} className="py-2">
            <MemberAvatar name={item.createdByName} size="sm" />
            <List.ItemText>
              <Text size="sm" className="truncate">
                {item.description}
              </Text>
              <Text size="xs" color="secondary" className="truncate">
                {item.createdByName} · {item.accountName} · {formatIsoDate(item.date)}
              </Text>
            </List.ItemText>
            <MoneyValue
              cents={item.amountCents}
              kind={item.kind}
              showPlusSign={item.kind === 'income'}
              size="sm"
              className="tabular-nums"
            />
          </List.Item>
        ))}
      </List.Root>
    </DashboardCard>
  );
}
