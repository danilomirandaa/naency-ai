import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { MoneyValue } from '@/components/finance/MoneyValue';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/components/ui/Sidebar';
import type { AccountType } from '@/lib/accounts';
import Link from 'next/link';

export type NavAccount = {
  id: string;
  name: string;
  type: AccountType;
  institution: { name: string; color: string } | null;
  /** Saldo da conta; no cartão, a dívida (negativa). */
  balanceCents: number;
};

export type NavAccountsProps = {
  accounts: NavAccount[];
  /** Editor e admin veem "Nova conta". */
  canCreate: boolean;
};

/** Contas ativas do espaço; cada uma leva à linha dela na página de contas. */
export function NavAccounts({ accounts, canCreate }: NavAccountsProps) {
  if (accounts.length === 0 && !canCreate) {
    return null;
  }

  return (
    <Sidebar.Group className="group-data-[collapsible=icon]:hidden">
      <Sidebar.GroupLabel asChild>
        <Link href="/contas">Contas</Link>
      </Sidebar.GroupLabel>
      <Sidebar.Menu>
        {accounts.map((account) => (
          <Sidebar.MenuItem key={account.id}>
            <Sidebar.MenuButton asChild size="lg">
              <Link href={`/contas#conta-${account.id}`}>
                <AccountAvatar type={account.type} institution={account.institution} size="sm" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate">{account.name}</span>
                  <MoneyValue
                    cents={account.balanceCents}
                    // Negativo é dívida (cartão) ou conta no vermelho.
                    kind={account.balanceCents < 0 ? 'expense' : 'neutral'}
                    size="xs"
                    weight="normal"
                    className="truncate"
                  />
                </div>
              </Link>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        ))}
        {canCreate && (
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild className="text-typography-neutral-secondary">
              <Link href="/contas?nova=1">
                <Icon icon="add" />
                <span>Nova conta</span>
              </Link>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        )}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}
