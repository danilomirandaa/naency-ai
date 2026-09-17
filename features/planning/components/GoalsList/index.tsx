import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Meter } from '@/components/ui/Meter';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { GoalSummary } from '@/features/planning/types';
import { formatIsoDate } from '@/lib/dates';

export type GoalsListProps = {
  goals: GoalSummary[];
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (goal: GoalSummary) => void;
  onDelete: (goal: GoalSummary) => void;
  isLoading?: boolean;
  isError?: boolean;
};

/** Metas de economia acompanhando o saldo de uma conta. */
export function GoalsList({ goals, canEdit, onCreate, onEdit, onDelete, isLoading = false, isError = false }: GoalsListProps) {
  if (isLoading || isError || goals.length === 0) {
    return (
      <Panel.Root>
        <Panel.QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty
          emptyIcon="goal"
          emptyMessage="Nenhuma meta"
          emptyDescription="Ligue a meta à conta onde o dinheiro fica (ex.: reserva) e acompanhe o progresso."
          emptyAction={
            canEdit && (
              <Button onClick={onCreate}>
                <Icon icon="add" data-icon="inline-start" />
                Nova meta
              </Button>
            )
          }
        >
          {null}
        </Panel.QueryState>
      </Panel.Root>
    );
  }

  return (
    <ul aria-label="Metas" className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => {
        const saved = Math.max(goal.savedCents, 0);
        const done = saved >= goal.targetCents;
        const percent = Math.min(100, Math.round((saved / goal.targetCents) * 100));
        return (
          <li key={goal.id}>
            <Panel.Root className="h-full">
              <div className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <AccountAvatar type={goal.account.type} institution={goal.account.institution} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Text size="sm" weight="medium" className="truncate">
                      {goal.name}
                    </Text>
                    <Text size="xs" color="secondary" className="truncate">
                      Em {goal.account.name}
                      {goal.targetDate && ` · até ${formatIsoDate(goal.targetDate)}`}
                    </Text>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${goal.name}`} onClick={() => onEdit(goal)}>
                        <Icon icon="edit" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${goal.name}`} onClick={() => onDelete(goal)}>
                        <Icon icon="delete" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <MoneyValue cents={saved} kind="neutral" size="lg" weight="semibold" className="tabular-nums" />
                  <Text size="xs" color="secondary">
                    de <MoneyValue cents={goal.targetCents} kind="neutral" size="xs" weight="normal" /> · {percent}%
                  </Text>
                </div>
                <Meter label={`Progresso de ${goal.name}`} value={saved} max={goal.targetCents} tone="progress" valueText={`${percent}% da meta`} />
                <Text size="xs" color="secondary">
                  {done
                    ? 'Meta alcançada 🎉'
                    : goal.monthlyNeededCents !== null
                      ? <>Guarde <MoneyValue cents={goal.monthlyNeededCents} kind="neutral" size="xs" /> por mês para chegar na data.</>
                      : <>Faltam <MoneyValue cents={goal.targetCents - saved} kind="neutral" size="xs" />.</>}
                </Text>
              </div>
            </Panel.Root>
          </li>
        );
      })}
    </ul>
  );
}
