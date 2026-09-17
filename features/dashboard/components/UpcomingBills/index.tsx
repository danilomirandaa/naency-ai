import { MoneyValue } from '@/components/finance/MoneyValue';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import type { UpcomingItem } from '@/features/dashboard/types';
import { formatIsoDate } from '@/lib/dates';
import Link from 'next/link';

export type UpcomingBillsProps = {
  data: UpcomingItem[] | undefined;
  /** "AAAA-MM-DD" de hoje, para marcar atrasados e contar os dias. */
  today: string;
  isLoading?: boolean;
  isError?: boolean;
};

function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function when(date: string, today: string) {
  const days = daysUntil(date, today);
  if (days < 0) {
    return days === -1 ? 'venceu ontem' : `venceu há ${-days} dias`;
  }
  if (days === 0) {
    return 'vence hoje';
  }
  return days === 1 ? 'vence amanhã' : `vence em ${days} dias`;
}

/** "O que vence em breve?": contas previstas (inclusive atrasadas) e faturas nos próximos 30 dias. */
export function UpcomingBills({ data, today, isLoading, isError }: UpcomingBillsProps) {
  const items = data ?? [];
  return (
    <DashboardCard
      title="A vencer"
      description="Próximos 30 dias"
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      emptyIcon="calendar"
      emptyMessage="Nada vencendo nos próximos dias"
      emptyDescription="Lançamentos previstos e faturas de cartão aparecem aqui."
    >
      <List.Root aria-label="Contas a vencer">
        {items.map((item) => {
          const overdue = daysUntil(item.date, today) < 0;
          const href =
            item.type === 'invoice' ? `/cartoes/${item.accountId}?fatura=${item.referenceMonth}` : '/transacoes';
          return (
            <List.Item key={`${item.type}-${item.id}`} className="py-2">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-control-sm bg-background-neutral-100 text-icon-neutral-rest [&_svg]:size-4"
              >
                <Icon icon={item.type === 'invoice' ? 'credit-card' : 'calendar'} />
              </span>
              <List.ItemText>
                <Link href={href} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                  {item.description}
                </Link>
                <Text size="xs" color="secondary" className="flex items-center gap-1.5">
                  {formatIsoDate(item.date)} · {when(item.date, today)}
                  {overdue && <Panel.RowBadge color="red">Atrasado</Panel.RowBadge>}
                </Text>
              </List.ItemText>
              <MoneyValue cents={Math.abs(item.amountCents)} kind="neutral" size="sm" className="tabular-nums" />
            </List.Item>
          );
        })}
      </List.Root>
    </DashboardCard>
  );
}
