'use client';

import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { AcceptInvitationState } from '@/features/members/schemas';
import { ROLE_LABELS, type WorkspaceRole } from '@/lib/permissions';
import Link from 'next/link';
import * as React from 'react';

export type AcceptInvitationView =
  | { status: 'valid'; workspaceName: string; role: WorkspaceRole }
  | { status: 'already-member'; workspaceName: string }
  | { status: 'not-found' | 'expired' | 'used' }
  | { status: 'email-mismatch'; invitedEmail: string; currentEmail: string | null };

export type AcceptInvitationProps = {
  view: AcceptInvitationView;
  acceptAction: (state: AcceptInvitationState) => Promise<AcceptInvitationState>;
  signOutAction: () => Promise<void>;
};

const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  admin: 'Você poderá gerenciar tudo, inclusive as pessoas.',
  editor: 'Você poderá lançar, editar e importar extratos.',
  viewer: 'Você poderá acompanhar tudo, sem editar.',
};

function Heading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Text element="h1" size="3xl" weight="semibold" className="tracking-tight">
        {title}
      </Text>
      <Text element="p" size="base" color="secondary">
        {children}
      </Text>
    </div>
  );
}

export function AcceptInvitation({ view, acceptAction, signOutAction }: AcceptInvitationProps) {
  const [state, formAction, isPending] = React.useActionState(acceptAction, { status: 'idle' });

  return (
    <div className="flex flex-col gap-8">
      <BrandMark variant="icon" />

      {view.status === 'valid' && (
        <div className="flex flex-col gap-6">
          <Heading title={`Entrar em ${view.workspaceName}`}>
            O convite é para o papel <Text weight="medium">{ROLE_LABELS[view.role]}</Text>.{' '}
            {ROLE_DESCRIPTIONS[view.role]}
          </Heading>
          {state.status === 'error' && (
            <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
              {state.message}
            </Panel.Callout>
          )}
          <form action={formAction}>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full"
            >
              {isPending && <Spinner label={null} data-icon="inline-start" />}
              {isPending ? 'Entrando…' : 'Aceitar convite'}
              {!isPending && <Icon icon="arrow-right" data-icon="inline-end" />}
            </Button>
          </form>
        </div>
      )}

      {view.status === 'already-member' && (
        <div className="flex flex-col gap-6">
          <Heading title="Você já está neste espaço">
            Você já faz parte de {view.workspaceName}.
          </Heading>
          <Button size="lg" asChild className="w-full">
            <Link href="/">Ir para o Naency</Link>
          </Button>
        </div>
      )}

      {view.status === 'email-mismatch' && (
        <div className="flex flex-col gap-6">
          <Heading title="Convite para outro e-mail">
            Este convite foi enviado para <Text weight="medium">{view.invitedEmail}</Text>
            {view.currentEmail ? `, e você entrou com ${view.currentEmail}` : ''}. Entre com o
            e-mail convidado para aceitar.
          </Heading>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="lg" className="w-full">
              Sair e entrar com outro e-mail
            </Button>
          </form>
        </div>
      )}

      {(view.status === 'not-found' || view.status === 'expired' || view.status === 'used') && (
        <div className="flex flex-col gap-6">
          <Heading
            title={
              view.status === 'expired'
                ? 'Convite expirado'
                : view.status === 'used'
                  ? 'Convite já usado'
                  : 'Convite não encontrado'
            }
          >
            {view.status === 'expired'
              ? 'Convites valem por 7 dias. Peça um novo link para quem convidou você.'
              : view.status === 'used'
                ? 'Este link já foi aceito. Se foi você, é só entrar no Naency.'
                : 'Confira se o link está completo ou peça um novo para quem convidou você.'}
          </Heading>
          <Button variant="outline" size="lg" asChild className="w-full">
            <Link href="/">Ir para o Naency</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
