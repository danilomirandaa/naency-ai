import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Meter } from '@/components/ui/Meter';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { BudgetLine } from '@/features/planning/types';

export type BudgetsListProps = {
  lines: BudgetLine[];
  canEdit: boolean;
  onEdit: (line: BudgetLine) => void;
  isLoading?: boolean;
  isError?: boolean;
};

/** Orçamento mensal por categoria principal: gasto × orçado. */
export function BudgetsList({ lines, canEdit, onEdit, isLoading = false, isError = false }: BudgetsListProps) {
  const planned = lines.filter((line) => line.budgetCents !== null);
  const totalBudget = planned.reduce((sum, line) => sum + (line.budgetCents ?? 0), 0);
  const totalSpent = planned.reduce((sum, line) => sum + line.spentCents, 0);

  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Orçamento do mês</Panel.Title>
          <Panel.Description>
            {planned.length > 0 ? (
              <>
                Gasto <MoneyValue cents={totalSpent} kind="neutral" size="xs" /> de{' '}
                <MoneyValue cents={totalBudget} kind="neutral" size="xs" /> orçados
              </>
            ) : (
              'Defina quanto quer gastar por categoria.'
            )}
          </Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <Panel.Body>
        <Panel.QueryState isLoading={isLoading} isError={isError} isEmpty={lines.length === 0} emptyMessage="Nenhuma categoria de despesa">
          <List.Root aria-label="Orçamentos por categoria">
            {lines.map((line) => {
              const over = line.budgetCents !== null && line.spentCents > line.budgetCents;
              return (
                <List.Item key={line.categoryId} className="items-start">
                  <CategoryIcon icon={line.icon} color={line.color} />
                  <List.ItemText className="gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Text size="sm" weight="medium" className="truncate">
                        {line.name}
                      </Text>
                      {line.budgetCents !== null ? (
                        <Text size="xs" color={over ? 'error' : 'secondary'} className="tabular-nums">
                          <MoneyValue cents={line.spentCents} kind="neutral" size="xs" weight="normal" /> de{' '}
                          <MoneyValue cents={line.budgetCents} kind="neutral" size="xs" weight="normal" />
                        </Text>
                      ) : (
                        <Text size="xs" color="secondary">
                          Sem orçamento · gasto <MoneyValue cents={line.spentCents} kind="neutral" size="xs" weight="normal" />
                        </Text>
                      )}
                    </div>
                    {line.budgetCents !== null && (
                      <>
                        <Meter
                          label={`Orçamento de ${line.name}`}
                          value={line.spentCents}
                          max={line.budgetCents}
                          valueText={`${Math.round((line.spentCents / line.budgetCents) * 100)}% do orçamento`}
                        />
                        {over && (
                          <Text size="xs" color="error">
                            Passou <MoneyValue cents={line.spentCents - line.budgetCents} kind="neutral" size="xs" /> do orçado
                          </Text>
                        )}
                      </>
                    )}
                  </List.ItemText>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(line)} aria-label={`${line.budgetCents === null ? 'Definir' : 'Editar'} orçamento de ${line.name}`}>
                      <Icon icon={line.budgetCents === null ? 'add' : 'edit'} data-icon="inline-start" />
                      {line.budgetCents === null ? 'Definir' : 'Editar'}
                    </Button>
                  )}
                </List.Item>
              );
            })}
          </List.Root>
        </Panel.QueryState>
      </Panel.Body>
    </Panel.Root>
  );
}
