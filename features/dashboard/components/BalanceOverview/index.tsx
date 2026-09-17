import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { List } from '@/components/ui/List';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { BalanceData } from '@/features/dashboard/types';
import Link from 'next/link';

export type BalanceOverviewProps = {
  data: BalanceData | undefined;
  isLoading?: boolean;
  isError?: boolean;
};

/** Quanto temos agora: saldo das contas e, à parte, a dívida dos cartões. */
export function BalanceOverview({ data, isLoading, isError }: BalanceOverviewProps) {
  const accounts = data?.accounts ?? [];
  return (
    <DashboardCard
      title="Saldo agora"
      isLoading={isLoading}
      isError={isError}
      isEmpty={accounts.length === 0}
      emptyIcon="bank"
      emptyMessage="Nenhuma conta cadastrada"
      emptyAction={
        <Button asChild variant="outline">
          <Link href="/contas?nova=1">Cadastrar conta</Link>
        </Button>
      }
    >
      <div className="flex flex-col">
        <dl className="grid grid-cols-2 gap-px border-border-neutral-subtle border-b bg-border-neutral-subtle">
          <div className="flex flex-col gap-0.5 bg-background-neutral-000 px-4 py-3">
            <dt>
              <Text size="xs" color="secondary">
                Nas contas
              </Text>
            </dt>
            <dd>
              <MoneyValue cents={data?.availableCents ?? 0} size="xl" weight="semibold" className="tabular-nums" />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 bg-background-neutral-000 px-4 py-3">
            <dt>
              <Text size="xs" color="secondary">
                Devendo nos cartões
              </Text>
            </dt>
            <dd>
              <MoneyValue
                cents={Math.abs(Math.min(data?.cardsCents ?? 0, 0))}
                kind="neutral"
                size="xl"
                weight="semibold"
                className="tabular-nums"
              />
            </dd>
          </div>
        </dl>
        <List.Root aria-label="Saldo por conta">
          {accounts.map((account) => (
            <List.Item key={account.id} className="py-2">
              <AccountAvatar type={account.type} institution={account.institution} size="sm" />
              <List.ItemText>
                <Text size="sm" className="truncate">
                  {account.name}
                </Text>
              </List.ItemText>
              <MoneyValue cents={account.balanceCents} size="sm" className="tabular-nums" />
            </List.Item>
          ))}
        </List.Root>
      </div>
    </DashboardCard>
  );
}
