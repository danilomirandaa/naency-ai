'use client';

import { Button } from '@/components/ui/Button';
import { CopyInput } from '@/components/ui/CopyInput';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Text } from '@/components/ui/Text';
import {
  type InviteMemberState,
  initialInviteMemberState,
} from '@/features/members/schemas';
import * as React from 'react';

export type InviteMemberDialogProps = {
  /** Server Action que cria o convite (inviteMemberAction no app). */
  action: (state: InviteMemberState, formData: FormData) => Promise<InviteMemberState>;
};

const FORM_ID = 'invite-member-form';

export function InviteMemberDialog({ action }: InviteMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  // Trocar a key zera o formulário ("convidar outra pessoa" ou reabrir).
  const [attempt, setAttempt] = React.useState(0);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setAttempt((value) => value + 1);
    }
  };

  return (
    <>
      <Button size="large" icon={<Icon icon="add" />} onClick={() => setOpen(true)}>
        Convidar pessoa
      </Button>
      <InviteMemberDialogContent
        key={attempt}
        action={action}
        open={open}
        onOpenChange={handleOpenChange}
        onInviteAnother={() => setAttempt((value) => value + 1)}
      />
    </>
  );
}

function InviteMemberDialogContent({
  action,
  open,
  onOpenChange,
  onInviteAnother,
}: InviteMemberDialogProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteAnother: () => void;
}) {
  const [state, formAction, isPending] = React.useActionState(action, initialInviteMemberState);
  const error = state.status === 'error' ? state : null;

  const body =
    state.status === 'created' ? (
      <div className="flex flex-col gap-3">
        <Text size="sm" element="p">
          Envie este link para <Text weight="medium">{state.email}</Text>. Ele vale por 7 dias e só
          funciona entrando com esse e-mail.
        </Text>
        <CopyInput aria-label="Link do convite" value={state.link} />
      </div>
    ) : (
      <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="E-mail">
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              autoComplete="off"
              placeholder="pessoa@exemplo.com"
              defaultValue={error?.email}
              aria-invalid={error ? true : undefined}
              required
            />
          )}
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5">
            <Text size="xs" weight="medium">
              Papel
            </Text>
          </legend>
          <RadioGroup.Root name="role" defaultValue={error?.role || 'editor'} aria-label="Papel">
            <RadioGroup.Card
              value="editor"
              label="Editor"
              description="Lança, edita e importa extratos."
            />
            <RadioGroup.Card value="viewer" label="Leitor" description="Só acompanha, sem editar." />
          </RadioGroup.Root>
        </fieldset>
        {error && (
          <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
            {error.message}
          </Panel.Callout>
        )}
      </form>
    );

  const footer =
    state.status === 'created' ? (
      <>
        <Button variant="outline" onClick={onInviteAnother}>
          Convidar outra pessoa
        </Button>
        <DialogClose asChild>
          <Button>Concluir</Button>
        </DialogClose>
      </>
    ) : (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} isLoading={isPending}>
          {isPending ? 'Gerando…' : 'Gerar link de convite'}
        </Button>
      </>
    );

  return makeResponsiveDialog({
    title: state.status === 'created' ? 'Convite criado' : 'Convidar pessoa',
    description:
      state.status === 'created'
        ? undefined
        : 'A pessoa entra com a própria conta e vê este espaço.',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[480px]' },
    children: body,
    footer,
  });
}
