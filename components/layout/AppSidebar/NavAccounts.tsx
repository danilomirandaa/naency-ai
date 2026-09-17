import { AccountAvatar } from '@/components/finance/AccountAvatar';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/components/ui/Sidebar';
import type { AccountType } from '@/lib/accounts';
import Link from 'next/link';

export type NavAccount = {
  id: string;
  name: string;
  type: AccountType;
  institution: { name: string; color: string } | null;
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
            <Sidebar.MenuButton asChild>
              <Link href={`/contas#conta-${account.id}`}>
                <AccountAvatar type={account.type} institution={account.institution} size="sm" />
                <span>{account.name}</span>
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
