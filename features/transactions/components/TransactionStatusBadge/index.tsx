import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import {
  type TransactionKind,
  type TransactionSituation,
  type TransactionStatus,
  situationLabel,
  transactionSituation,
} from '@/lib/transactions';

/**
 * O peso visual acompanha a urgência: atrasada é sólida e salta da linha, a
 * pagar é contornada e paga é neutra — o que já está resolvido não disputa
 * atenção com o que precisa de ação.
 */
const STYLES: Record<TransactionSituation, Pick<BadgeProps, 'variant' | 'tone'>> = {
  overdue: { variant: 'solid', tone: 'critical' },
  pending: { variant: 'outline', tone: 'critical' },
  paid: { variant: 'neutral' },
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
    <Badge {...STYLES[situation]} className={className}>
      {situation === 'paid' && <Icon icon="check-double" aria-hidden />}
      {situationLabel(situation, kind)}
    </Badge>
  );
}
