'use client';

import { AccountSelect, type AccountOption } from '@/components/finance/AccountSelect';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { CreateImportInput } from '@/features/imports/schemas';
import { decodeStatement } from '@/lib/import/decode';
import * as React from 'react';

export type ImportUploadFormProps = {
  accounts: AccountOption[];
  defaultAccountId?: string | null;
  /** Lê o arquivo no servidor e devolve o lote para revisão. */
  onSubmit: (input: CreateImportInput) => Promise<{ ok: true; batchId: string } | { ok: false; message: string }>;
  onCreated: (batchId: string) => void;
};

const ACCEPT = '.ofx,.qfx,.csv,.txt';

/** Escolha da conta e do arquivo (OFX ou CSV). O arquivo é lido no navegador. */
export function ImportUploadForm({ accounts, defaultAccountId = null, onSubmit, onCreated }: ImportUploadFormProps) {
  const [accountId, setAccountId] = React.useState<string | null>(defaultAccountId);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const inputId = React.useId();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountId) {
      setError('Escolha a conta do extrato.');
      return;
    }
    if (!file) {
      setError('Escolha o arquivo do extrato.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const text = decodeStatement(await file.arrayBuffer());
      const result = await onSubmit({ accountId, fileName: file.name, text });
      if (result.ok) {
        onCreated(result.batchId);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Panel.Root>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4" noValidate>
        <Field label="Conta do extrato">
          {(control) => (
            <AccountSelect
              {...control}
              accounts={accounts.filter((account) => !account.archived)}
              value={accountId}
              onValueChange={setAccountId}
            />
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-control border border-border-neutral-rest border-dashed px-4 py-8 text-center transition-colors hover:bg-background-neutral-100 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          >
            <Icon icon="upload" className="size-6 text-icon-neutral-rest" />
            <Text size="sm" weight="medium">
              {file ? file.name : 'Escolher arquivo do extrato'}
            </Text>
            <Text size="xs" color="secondary">
              OFX ou CSV exportado do banco. Nada é salvo antes da revisão.
            </Text>
            <input
              id={inputId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </label>
        </div>
        {error && (
          <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
            {error}
          </Panel.Callout>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner label={null} data-icon="inline-start" /> : <Icon icon="upload" data-icon="inline-start" />}
            {isPending ? 'Lendo…' : 'Ler extrato'}
          </Button>
        </div>
      </form>
    </Panel.Root>
  );
}
