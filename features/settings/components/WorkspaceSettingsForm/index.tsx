'use client';

import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import type { RenameWorkspaceState } from '@/features/settings/actions';
import * as React from 'react';

export type WorkspaceSettingsFormProps = {
  name: string;
  canManage: boolean;
  action: (state: RenameWorkspaceState, formData: FormData) => Promise<RenameWorkspaceState>;
};

/** Nome do espaço; só administradores alteram. */
export function WorkspaceSettingsForm({ name, canManage, action }: WorkspaceSettingsFormProps) {
  const [state, formAction, isPending] = React.useActionState<RenameWorkspaceState, FormData>(action, { status: 'idle' });
  const error = state.status === 'error' ? state : null;

  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Espaço</Panel.Title>
          <Panel.Description>
            {canManage ? 'O nome aparece para todos os membros.' : 'Só administradores alteram o espaço.'}
          </Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <form action={formAction} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end" noValidate>
        <Field label="Nome do espaço" error={error?.message} className="flex-1">
          {(control) => (
            <Input
              {...control}
              key={state.status}
              name="name"
              defaultValue={error?.name ?? name}
              disabled={!canManage}
              maxLength={60}
            />
          )}
        </Field>
        {canManage && (
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending && <Spinner label={null} data-icon="inline-start" />}
            Salvar
          </Button>
        )}
      </form>
      {state.status === 'saved' && (
        <p role="status" className="px-4 pb-4 text-xs text-typography-neutral-secondary">
          Nome salvo.
        </p>
      )}
    </Panel.Root>
  );
}
