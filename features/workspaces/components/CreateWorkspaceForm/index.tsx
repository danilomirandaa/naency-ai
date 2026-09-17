'use client';

import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import {
  type CreateWorkspaceState,
  initialCreateWorkspaceState,
} from '@/features/workspaces/schemas';
import Link from 'next/link';
import * as React from 'react';

export type CreateWorkspaceFormProps = {
  /** Server Action que cria o espaço (createWorkspaceAction no app). */
  action: (state: CreateWorkspaceState, formData: FormData) => Promise<CreateWorkspaceState>;
  /** Mostra "Voltar" quando a pessoa já tem outros espaços. */
  backHref?: string;
};

export function CreateWorkspaceForm({ action, backHref }: CreateWorkspaceFormProps) {
  const [state, formAction, isPending] = React.useActionState(
    action,
    initialCreateWorkspaceState,
  );
  const error = state.status === 'error' ? state.message : null;

  return (
    <div className="flex flex-col gap-8">
      <BrandMark variant="icon" />

      <div className="flex flex-col gap-2">
        <Text element="h1" size="3xl" weight="semibold" className="tracking-tight">
          Crie seu espaço
        </Text>
        <Text element="p" size="base" color="secondary">
          É onde ficam contas, cartões e lançamentos. Depois você convida quem divide as
          finanças com você.
        </Text>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Nome do espaço" description="Dá para mudar depois.">
          {(control) => (
            <Input
              {...control}
              name="name"
              placeholder="Finanças da casa"
              autoComplete="off"
              maxLength={60}
              defaultValue={state.status === 'error' ? state.name : undefined}
              required
              aria-invalid={error ? true : undefined}
            />
          )}
        </Field>
        {error && (
          <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
            {error}
          </Panel.Callout>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full"
        >
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {isPending ? 'Criando…' : 'Criar espaço'}
          {!isPending && <Icon icon="arrow-right" data-icon="inline-end" />}
        </Button>
        {backHref && (
          <Button variant="ghost" size="lg" asChild className="w-full">
            <Link href={backHref}>Voltar</Link>
          </Button>
        )}
      </form>
    </div>
  );
}
