// Exports nomeados: este componente roda no servidor, e um objeto composto
// (`Avatar.Root`) vindo de módulo 'use client' chega undefined lá.
import { AvatarFallback, AvatarImage, AvatarRoot } from '@/components/ui/Avatar';
import { classMerge } from '@/lib/utils';

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

export type MemberAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'default' | 'lg';
  /** `square` na sidebar; `circle` em listas. */
  shape?: 'circle' | 'square';
  className?: string;
};

/** Avatar de uma pessoa do espaço, com iniciais quando não há foto. */
export function MemberAvatar({
  name,
  avatarUrl,
  size = 'default',
  shape = 'circle',
  className,
}: MemberAvatarProps) {
  const radius = shape === 'square' ? 'rounded-control-sm' : undefined;
  return (
    <AvatarRoot size={size} className={classMerge(radius, className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className={radius}>{getInitials(name)}</AvatarFallback>
    </AvatarRoot>
  );
}
