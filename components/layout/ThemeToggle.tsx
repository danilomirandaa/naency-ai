'use client';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon, type Icons } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { type Theme, isTheme } from '@/lib/theme';

const options: { value: Theme; label: string; icon: Icons }[] = [
  { value: 'light', label: 'Claro', icon: 'theme-light' },
  { value: 'dark', label: 'Escuro', icon: 'theme-dark' },
  { value: 'system', label: 'Sistema', icon: 'theme-system' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" title="Tema" className="size-7">
          {/* O ícone segue a classe .dark (já aplicada no <head>), sem depender da hidratação. */}
          <Icon icon="theme-light" className="dark:hidden" />
          <Icon icon="theme-dark" className="hidden dark:block" />
          <span className="sr-only">Alterar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-typography-neutral-secondary text-xs font-medium">
          Tema
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => isTheme(value) && setTheme(value)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="gap-2"
            >
              <Icon icon={option.icon} className="size-4 text-icon-neutral-rest" />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
