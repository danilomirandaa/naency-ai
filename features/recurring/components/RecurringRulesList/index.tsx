'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import type { RecurringRuleSummary } from '@/features/recurring/types';
import { formatIsoDate } from '@/lib/dates';
import { RECURRENCE_FREQUENCY_LABELS } from '@/lib/recurrence';
import { useTransition } from 'react';

export type RecurringRulesListProps = {
  rules: RecurringRuleSummary[];
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (rule: RecurringRuleSummary) => void;
  onDelete: (rule: RecurringRuleSummary) => void;
  onActiveChange: (rule: RecurringRuleSummary, active: boolean) => Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
};

function ActiveSwitch({ rule, onActiveChange }: Pick<RecurringRulesListProps, 'onActiveChange'> & { rule: RecurringRuleSummary }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Switch
      aria-label={`${rule.active ? 'Pausar' : 'Retomar'} ${rule.description}`}
      checked={rule.active}
      isLoading={isPending}
      onCheckedChange={(active) => startTransition(() => onActiveChange(rule, active))}
    />
  );
}

/** Receitas e despesas que se repetem, com a próxima data e pausa. */
export function RecurringRulesList({
  rules,
  canEdit,
  onCreate,
  onEdit,
  onDelete,
  onActiveChange,
  isLoading = false,
  isError = false,
}: RecurringRulesListProps) {
  return (
    <Panel.Root>
      <Panel.Body>
        <Panel.QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={rules.length === 0}
          errorMessage="Não foi possível carregar as recorrências"
          emptyIcon="recurring"
          emptyMessage="Nenhuma recorrência"
          emptyDescription="Aluguel, salário e assinaturas viram lançamentos previstos que aparecem em “A vencer”."
          emptyAction={
            canEdit && (
              <Button onClick={onCreate}>
                <Icon icon="add" data-icon="inline-start" />
                Nova recorrência
              </Button>
            )
          }
        >
          <List.Root aria-label="Recorrências">
            {rules.map((rule) => (
              <List.Item key={rule.id}>
                {rule.category ? (
                  <CategoryIcon icon={rule.category.icon} color={rule.category.color} />
                ) : (
                  <span aria-hidden className="flex size-8 items-center justify-center rounded-control-sm bg-background-neutral-100 text-icon-neutral-rest [&_svg]:size-4">
                    <Icon icon="recurring" />
                  </span>
                )}
                <List.ItemText>
                  <Text size="sm" weight="medium" color={rule.active ? 'primary' : 'secondary'} className="truncate">
                    {rule.description}
                  </Text>
                  <Text size="xs" color="secondary" className="truncate">
                    {RECURRENCE_FREQUENCY_LABELS[rule.frequency]} · {rule.account.name} ·{' '}
                    {rule.active
                      ? rule.nextDate
                        ? `próxima ${formatIsoDate(rule.nextDate)}`
                        : 'terminou'
                      : 'pausada'}
                  </Text>
                </List.ItemText>
                <MoneyValue
                  cents={rule.kind === 'income' ? rule.amountCents : -rule.amountCents}
                  kind={rule.kind}
                  showPlusSign={rule.kind === 'income'}
                  size="sm"
                  className="tabular-nums"
                />
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <ActiveSwitch rule={rule} onActiveChange={onActiveChange} />
                    <Button variant="ghost" size="icon-sm" aria-label={`Editar ${rule.description}`} onClick={() => onEdit(rule)}>
                      <Icon icon="edit" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${rule.description}`} onClick={() => onDelete(rule)}>
                      <Icon icon="delete" />
                    </Button>
                  </div>
                )}
              </List.Item>
            ))}
          </List.Root>
        </Panel.QueryState>
      </Panel.Body>
    </Panel.Root>
  );
}
