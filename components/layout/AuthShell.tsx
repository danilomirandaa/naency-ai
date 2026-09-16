import { Icon, type Icons } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type * as React from 'react';

const highlights: { icon: Icons; title: string; description: string }[] = [
  {
    icon: 'transactions',
    title: 'Extratos de qualquer banco',
    description: 'Importe PDF, CSV ou OFX; a AI organiza e você revisa.',
  },
  {
    icon: 'user',
    title: 'Compartilhado com quem divide as contas',
    description: 'Cada um com a sua conta, vendo o mesmo espaço.',
  },
  {
    icon: 'credit-card',
    title: 'Cartões, faturas e parcelas',
    description: 'Saiba o que vence e para onde vai o dinheiro.',
  },
];

/** Painel lateral das telas de autenticação: o que o Naency faz. */
function AuthShowcase() {
  return (
    <aside
      aria-label="Sobre o Naency"
      className="relative hidden flex-col justify-between overflow-hidden border-border-neutral-subtle border-l bg-background-surface-sunken p-12 lg:flex"
    >
      {/* Textura de pontos, com fade nas bordas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border-neutral-hover)_1px,transparent_1px)] [background-size:6px_6px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] opacity-60"
      />

      <div />

      <div className="relative flex max-w-md flex-col gap-8 self-center">
        <div className="flex flex-col gap-3">
          <Text element="h2" size="3xl" weight="semibold" className="text-balance leading-tight">
            As finanças da casa, num lugar só.
          </Text>
          <Text element="p" size="base" color="secondary" className="text-pretty">
            Entenda para onde vai o dinheiro e divida o controle com quem mora com você.
          </Text>
        </div>
        <ul className="flex flex-col gap-5">
          {highlights.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-border-neutral-subtle bg-background-neutral-000">
                <Icon icon={item.icon} className="size-4 text-icon-neutral-rest" />
              </span>
              <span className="flex flex-col gap-0.5">
                <Text size="sm" weight="medium">
                  {item.title}
                </Text>
                <Text size="sm" color="secondary">
                  {item.description}
                </Text>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2">
        <Icon icon="shield-lock" className="size-4 text-icon-neutral-rest" />
        <Text size="xs" color="secondary">
          Seus dados ficam no seu espaço. Ninguém vê sem convite.
        </Text>
      </div>
    </aside>
  );
}

/** Moldura das telas sem sessão (login, aceite de convite). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)]">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <AuthShowcase />
    </div>
  );
}
