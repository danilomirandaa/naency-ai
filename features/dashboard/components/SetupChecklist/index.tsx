import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { SetupProgress } from '@/features/dashboard/types';
import { classMerge } from '@/lib/utils';
import Link from 'next/link';

export type SetupChecklistProps = {
  progress: SetupProgress | undefined;
  canEdit: boolean;
};

/** "Complete sua configuração": some quando tudo está feito ou para quem só acompanha. */
export function SetupChecklist({ progress, canEdit }: SetupChecklistProps) {
  if (!progress || !canEdit) {
    return null;
  }
  const steps = [
    { done: progress.hasAccount, label: 'Cadastre suas contas e cartões', href: '/contas?nova=1', action: 'Cadastrar' },
    { done: progress.hasTransaction, label: 'Importe um extrato ou lance à mão', href: '/importar', action: 'Importar' },
    { done: progress.hasOtherMember, label: 'Convide quem divide as contas com você', href: '/membros', action: 'Convidar' },
  ];
  const remaining = steps.filter((step) => !step.done).length;
  if (remaining === 0) {
    return null;
  }

  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Complete sua configuração</Panel.Title>
          <Panel.Description>
            {remaining === 1 ? 'Falta 1 passo' : `Faltam ${remaining} passos`}
          </Panel.Description>
        </Panel.HeaderText>
      </Panel.Header>
      <ol aria-label="Passos da configuração" className="flex flex-col">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center gap-3 border-border-neutral-subtle border-t px-4 py-2.5"
          >
            <span
              className={classMerge(
                'flex size-6 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3.5',
                step.done
                  ? 'border-transparent bg-button-brand-primary-rest text-typography-brand-on-primary'
                  : 'border-border-neutral-rest',
              )}
            >
              {step.done && <Icon icon="check" aria-label="Feito" />}
            </span>
            <Text size="sm" color={step.done ? 'secondary' : 'primary'} className={classMerge('flex-1', step.done && 'line-through')}>
              {step.label}
            </Text>
            {!step.done && (
              <Button asChild variant="outline" size="sm">
                <Link href={step.href}>{step.action}</Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </Panel.Root>
  );
}
