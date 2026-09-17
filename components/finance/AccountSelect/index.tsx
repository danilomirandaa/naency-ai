'use client';

import { AccountAvatar } from '@/components/finance/AccountAvatar';
import type { FieldControlProps } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { AccountType } from '@/lib/accounts';
import * as React from 'react';

export type AccountOption = {
  id: string;
  name: string;
  type: AccountType;
  institution: { name: string; color: string } | null;
  archived?: boolean;
};

export type AccountSelectProps = Partial<FieldControlProps> & {
  accounts: AccountOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (accountId: string | null) => void;
  /** Com `name`, envia o id (ou "") no formulário. */
  name?: string;
  placeholder?: string;
  /** Opção "todas" para filtros; `null` esconde. */
  allLabel?: string | null;
  /** Conta que não pode ser escolhida (ex.: origem de uma transferência). */
  excludeId?: string | null;
  disabled?: boolean;
};

const ALL = 'all';

/** Escolha de conta com a marca da instituição. Arquivadas só aparecem se já estiverem escolhidas. */
export function AccountSelect({
  accounts,
  value,
  defaultValue = null,
  onValueChange,
  name,
  placeholder = 'Escolha a conta',
  allLabel = null,
  excludeId = null,
  disabled,
  ...control
}: AccountSelectProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | null>(defaultValue);
  const selected = isControlled ? value : internal;
  const options = accounts.filter(
    (account) => account.id !== excludeId && (!account.archived || account.id === selected),
  );
  const known = selected !== null && options.some((account) => account.id === selected);

  const handleChange = (next: string) => {
    const id = next === ALL ? null : next;
    if (!isControlled) {
      setInternal(id);
    }
    onValueChange?.(id);
  };

  return (
    <>
      <Select.Root
        value={known ? (selected as string) : allLabel !== null ? ALL : ''}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <Select.Trigger {...control}>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content>
          {allLabel !== null && <Select.Item value={ALL}>{allLabel}</Select.Item>}
          {options.map((account) => (
            <Select.Item key={account.id} value={account.id}>
              <AccountAvatar type={account.type} institution={account.institution} size="sm" />
              {account.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {name && <input type="hidden" name={name} value={known ? (selected as string) : ''} />}
    </>
  );
}
