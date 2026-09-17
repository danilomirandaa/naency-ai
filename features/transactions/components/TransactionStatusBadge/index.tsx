import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { classMerge } from '@/lib/utils';
import {
  type TransactionKind,
  type TransactionSituation,
  type TransactionStatus,
  situationLabel,
  transactionSituation,
} from '@/lib/transactions';

const COLORS: Record<TransactionSituation, 'red' | 'yellow' | 'green'> = {
  overdue: 'red',
  pending: 'yellow',
  paid: 'green',
};

export type TransactionStatusBadgeProps = {
  kind: TransactionKind;
  status: TransactionStatus;
  date: string;
  /** "AAAA-MM-DD" de hoje: previsto antes disso está atrasado. */
  today: string;
  className?: string;
};

/** Situação do lançamento: Atrasada, A pagar/A receber ou Paga/Recebida. */
export function TransactionStatusBadge({ kind, status, date, today, className }: TransactionStatusBadgeProps) {
  const situation = transactionSituation(status, date, today);
  return (
    <Panel.RowBadge color={COLORS[situation]} className={classMerge('gap-1', className)}>
      {situation === 'overdue' && <Icon icon="alert-circle" className="size-3" />}
      {situationLabel(situation, kind)}
    </Panel.RowBadge>
  );
}
