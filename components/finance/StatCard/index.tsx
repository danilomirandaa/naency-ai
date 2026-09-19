import { MoneyValue, type MoneyValueProps } from '@/components/finance/MoneyValue';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import Link from 'next/link';
import * as React from 'react';

export type StatTone = 'warning' | 'income' | 'expense' | 'neutral';

/** Quem usa decide o que é bom: receber mais é bom, gastar mais não. */
export type StatTrend = {
  /** Variação em pontos percentuais; 0 vira "igual". */
  percent: number;
  /** Com o que está sendo comparado ("vs. mês anterior"). */
  comparedTo: string;
  /** Subir é bom (receitas) ou ruim (despesas)? */
  upIs: 'good' | 'bad';
};

// Cor sutil: fundo do ícone com 12% da cor.
const TONE_CLASSES: Record<StatTone, string> = {
  warning: 'bg-icon-status-warning-rest/12 text-icon-status-warning-rest',
  income: 'bg-icon-finance-income/12 text-icon-finance-income',
  expense: 'bg-icon-finance-expense/12 text-icon-finance-expense',
  neutral: 'bg-background-neutral-100 text-icon-neutral-rest',
};

export type StatCardProps = {
  label: string;
  icon: Icons;
  tone?: StatTone;
  cents: number;
  moneyKind?: MoneyValueProps['kind'];
  /** Cor do valor quando não é a do tipo (ex.: pendente em amarelo). */
  valueClassName?: string;
  showPlusSign?: boolean;
  /** Linha de apoio abaixo do valor ("15 despesas pendentes"). */
  detail?: string;
  trend?: StatTrend;
  /** Quando informado, o card inteiro vira link para a lista por trás do número. */
  href?: string;
  isLoading?: boolean;
};

/** "+12%" / "−8%" / "igual", com a cor dizendo se é boa notícia. */
export function trendLabel({ percent }: Pick<StatTrend, 'percent'>) {
  if (percent === 0) {
    return 'igual';
  }
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`;
}

function TrendLine({ trend }: { trend: StatTrend }) {
  const isGood = trend.percent === 0 ? null : (trend.percent > 0) === (trend.upIs === 'good');
  return (
    <Text size="xs" color="secondary" className="flex items-center gap-1">
      {trend.percent !== 0 && (
        <Icon
          icon={trend.percent > 0 ? 'arrow-up' : 'arrow-down'}
          aria-hidden
          className={classMerge('size-3', isGood ? 'text-icon-finance-income' : 'text-icon-finance-expense')}
        />
      )}
      <span className={classMerge(isGood === null ? undefined : isGood ? 'text-typography-finance-income' : 'text-typography-finance-expense')}>
        {trendLabel(trend)}
      </span>
      <span>{trend.comparedTo}</span>
    </Text>
  );
}

/**
 * Card de indicador: rótulo, valor grande e, quando faz sentido, a variação
 * sobre o período anterior. Usado na faixa do topo das telas de números
 * (lançamentos, visão geral), sempre dentro de `StatCard.Group`.
 */
export function StatCard({
  label,
  icon,
  tone = 'neutral',
  cents,
  moneyKind = 'neutral',
  valueClassName,
  showPlusSign,
  detail,
  trend,
  href,
  isLoading = false,
}: StatCardProps) {
  const content = (
    <>
      <dl className="flex min-w-0 flex-col gap-1">
        <dt>
          <Text size="xs" color="secondary">
            {label}
          </Text>
        </dt>
        <dd className="flex flex-col gap-0.5">
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <MoneyValue
              cents={cents}
              kind={moneyKind}
              showPlusSign={showPlusSign}
              size="lg"
              weight="semibold"
              className={classMerge('tabular-nums', valueClassName)}
            />
          )}
          {!isLoading && trend && <TrendLine trend={trend} />}
          {!isLoading && detail && (
            <Text size="xs" color="secondary">
              {detail}
            </Text>
          )}
        </dd>
      </dl>
      <span
        aria-hidden
        className={classMerge(
          'flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5',
          TONE_CLASSES[tone],
        )}
      >
        <Icon icon={icon} />
      </span>
    </>
  );

  const className =
    'flex items-start justify-between gap-3 bg-background-neutral-000 px-4 py-3 outline-hidden transition-colors';

  if (href && !isLoading) {
    return (
      <Link href={href} className={classMerge(className, 'hover:bg-background-neutral-100 focus-visible:bg-background-neutral-100')}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

/** Faixa de cards: fundo do painel aparecendo entre eles como divisória de 1px. */
export function StatCardGroup({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const COLUMNS = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
  } as const;
  return (
    <Panel.Root className={className}>
      <Panel.Body className={classMerge('grid grid-cols-1 gap-px bg-border-neutral-subtle', COLUMNS[columns])}>
        {children}
      </Panel.Body>
    </Panel.Root>
  );
}

StatCard.Group = StatCardGroup;
StatCard.displayName = 'StatCard';
StatCardGroup.displayName = 'StatCard.Group';
