'use client';

import { CategorySelect, type CategoryOption } from '@/components/finance/CategorySelect';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Checkbox } from '@/components/ui/Checkbox';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { ImportRowItem } from '@/features/imports/types';
import type { InvoiceMovement } from '@/lib/import/types';
import type { UpdateImportRowInput } from '@/features/imports/schemas';
import { formatIsoDate } from '@/lib/dates';
import { classMerge } from '@/lib/utils';

/** A fatura lista essas linhas, mas elas não são gasto do mês. */
const invoiceMovementLabel: Record<InvoiceMovement, string> = {
  payment: 'Pagamento de fatura',
  'carried-over': 'Fatura anterior',
};

const invoiceMovementHint: Record<InvoiceMovement, string> = {
  payment: 'Registre o pagamento em Pagar fatura',
  'carried-over': 'Este valor já foi lançado na fatura do mês passado',
};

export type ImportReviewTableProps = {
  rows: ImportRowItem[];
  categories: CategoryOption[];
  onRowChange: (row: ImportRowItem, changes: UpdateImportRowInput) => void;
  /** Importação concluída ou papel sem permissão: só leitura. */
  readOnly?: boolean;
};

/** Revisão linha a linha: incluir, categoria e "lembrar para os próximos". */
export function ImportReviewTable({ rows, categories, onRowChange, readOnly = false }: ImportReviewTableProps) {
  return (
    <Panel.Root>
      <Panel.Body>
        <ul aria-label="Linhas do extrato" className="flex flex-col">
          {rows.map((row) => {
            const kind = row.amountCents > 0 ? 'income' : 'expense';
            return (
              <li
                key={row.id}
                className={classMerge(
                  'grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 border-border-neutral-subtle border-b px-4 py-3 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_16rem_8rem]',
                  !row.include && 'bg-background-neutral-100/60',
                )}
              >
                <Checkbox
                  aria-label={`Incluir ${row.description}`}
                  checked={row.include}
                  disabled={readOnly}
                  onCheckedChange={(checked) => onRowChange(row, { include: checked === true })}
                />
                <div className="flex min-w-0 flex-col">
                  <Text
                    size="sm"
                    weight="medium"
                    className={classMerge('truncate', !row.include && 'text-typography-neutral-secondary')}
                  >
                    {row.description}
                  </Text>
                  <Text size="xs" color="secondary" className="flex flex-wrap items-center gap-1.5">
                    {formatIsoDate(row.date)}
                    {row.duplicate && (
                      <Panel.RowBadge color={row.duplicate === 'exact' ? 'gray' : 'yellow'}>
                        {row.duplicate === 'exact' ? 'Já importado' : 'Possível duplicado'}
                      </Panel.RowBadge>
                    )}
                    {row.installment && (
                      <Panel.RowBadge color="gray" title="A fatura traz a data da compra original">
                        Parcela {row.installment.number}/{row.installment.total}
                      </Panel.RowBadge>
                    )}
                    {row.invoiceMovement && (
                      <Panel.RowBadge color="yellow" title={invoiceMovementHint[row.invoiceMovement]}>
                        {invoiceMovementLabel[row.invoiceMovement]}
                      </Panel.RowBadge>
                    )}
                    {row.suggestedByRule && <Panel.RowBadge color="blue">Categoria lembrada</Panel.RowBadge>}
                    {row.suggestedByAi && <Panel.RowBadge color="gray">Sugerido pela AI</Panel.RowBadge>}
                    {row.description !== row.rawDescription && (
                      <span className="truncate" title={row.rawDescription}>
                        · {row.rawDescription}
                      </span>
                    )}
                  </Text>
                </div>
                <MoneyValue
                  cents={row.amountCents}
                  kind={kind}
                  showPlusSign={kind === 'income'}
                  size="sm"
                  // Coluna de largura fixa: valores de tamanhos diferentes não empurram a categoria.
                  className="justify-self-end text-right tabular-nums md:order-last"
                />
                <div className="col-span-3 flex flex-col gap-1.5 pl-7 md:col-span-1 md:pl-0">
                  <CategorySelect
                    aria-label={`Categoria de ${row.description}`}
                    categories={categories}
                    kind={kind}
                    value={row.categoryId}
                    disabled={readOnly || !row.include}
                    onValueChange={(categoryId) => onRowChange(row, { categoryId })}
                  />
                  {row.categoryId && !row.suggestedByRule && row.include && !readOnly && (
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={row.rememberCategory}
                        onCheckedChange={(checked) => onRowChange(row, { rememberCategory: checked === true })}
                      />
                      <Text size="xs" color="secondary">
                        Lembrar para os próximos
                      </Text>
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel.Body>
    </Panel.Root>
  );
}
