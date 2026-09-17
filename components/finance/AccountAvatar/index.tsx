import { InstitutionLogo } from '@/components/finance/InstitutionLogo';
import { Icon, type Icons } from '@/components/ui/Icon';
import type { AccountType } from '@/lib/accounts';
import { classMerge } from '@/lib/utils';

export const ACCOUNT_TYPE_ICONS: Record<AccountType, Icons> = {
  checking: 'bank',
  savings: 'savings',
  investment: 'investment',
  cash: 'cash',
  credit_card: 'credit-card',
};

export type AccountAvatarProps = {
  type: AccountType;
  institution: { name: string; color: string } | null;
  size?: 'sm' | 'md';
  className?: string;
};

/** Marca da instituição da conta; sem instituição, o ícone do tipo de conta. */
export function AccountAvatar({ type, institution, size = 'md', className }: AccountAvatarProps) {
  if (institution) {
    return (
      <InstitutionLogo
        name={institution.name}
        color={institution.color}
        size={size}
        className={className}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={classMerge(
        'flex shrink-0 items-center justify-center bg-background-neutral-100 text-icon-neutral-rest',
        size === 'sm' ? 'size-5 rounded-[5px] [&_svg]:size-3.5' : 'size-8 rounded-control-sm [&_svg]:size-4',
        className,
      )}
    >
      <Icon icon={ACCOUNT_TYPE_ICONS[type]} />
    </span>
  );
}
