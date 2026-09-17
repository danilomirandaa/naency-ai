'use client';

import { MoneyInput } from '@/components/finance/MoneyInput';
import { Button } from '@/components/ui/Button';
import { DeleteDialog } from '@/components/ui/DeleteDialog';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import type { BudgetLine } from '@/features/planning/types';
import * as React from 'react';

export type BudgetDialogProps = {
  line: BudgetLine | null;
  onOpenChange: (open: boolean) => void;
  onSave: (line: BudgetLine, amountCents: number | null) => Promise<{ ok: true } | { ok: false; message: string }>;
};

/** Define, altera ou remove o orçamento mensal de uma categoria. */
export function BudgetDialog({ line, onOpenChange, onSave }: BudgetDialogProps) {
  return <BudgetDialogContent key={line?.categoryId ?? 'fechado'} line={line} onOpenChange={onOpenChange} onSave={onSave} />;
}

function BudgetDialogContent({ line, onOpenChange, onSave }: BudgetDialogProps) {
  const [amount, setAmount] = React.useState<number | null>(line?.budgetCents ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [confirmingRemove, setConfirmingRemove] = React.useState(false);

  const save = (value: number | null) =>
    startTransition(async () => {
      if (!line) {
        return;
      }
      const result = await onSave(line, value);
      if (result.ok) {
        onOpenChange(false);
      } else {
        setError(result.message);
      }
    });

  const dialog = makeResponsiveDialog({
    title: line ? `Orçamento de ${line.name}` : 'Orçamento',
    description: 'Quanto você quer gastar por mês nesta categoria, subcategorias incluídas.',
    open: line !== null,
    onOpenChange,
    contentProps: { className: 'max-w-[420px]' },
    children: (
      <form
        id="budget-form"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (amount === null || amount <= 0) {
            setError('Informe um valor maior que zero.');
            return;
          }
          save(amount);
        }}
      >
        <Field label="Valor por mês" error={error ?? undefined}>
          {(control) => <MoneyInput {...control} value={amount} onValueChange={setAmount} placeholder="0,00" autoFocus />}
        </Field>
        {error && (
          <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
            {error}
          </Panel.Callout>
        )}
      </form>
    ),
    footer: (
      <>
        {line?.budgetCents !== null && line?.budgetCents !== undefined && (
          <Button variant="destructive" className="mr-auto" disabled={isPending} onClick={() => setConfirmingRemove(true)}>
            Remover
          </Button>
        )}
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form="budget-form" disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          Salvar
        </Button>
      </>
    ),
  });

  return (
    <>
      {dialog}
      <DeleteDialog
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        title="Remover orçamento"
        subtitle={`O orçamento de ${line?.name ?? ''} deixa de existir.`}
        warnText="Os lançamentos continuam iguais; só o limite mensal é removido."
        deleteButtonText="Remover"
        onConfirm={async () => {
          setConfirmingRemove(false);
          save(null);
        }}
      />
    </>
  );
}
