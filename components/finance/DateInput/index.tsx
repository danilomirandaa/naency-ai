import { Input, type InputProps } from '@/components/ui/Input';
import { classMerge } from '@/lib/utils';

export type DateInputProps = Omit<InputProps, 'type' | 'value' | 'defaultValue'> & {
  /** "2026-09-16" (controlado). */
  value?: string;
  /** "2026-09-16" (não controlado). */
  defaultValue?: string;
  /** Data mínima/máxima aceita, no mesmo formato. */
  min?: string;
  max?: string;
};

/**
 * Data de calendário (sem hora nem fuso), sempre "AAAA-MM-DD" no formulário.
 * Usa o seletor nativo: acessível e com o calendário do sistema no celular.
 */
export function DateInput({ className, ...props }: DateInputProps) {
  return (
    <Input
      {...props}
      type="date"
      className={classMerge('tabular-nums [color-scheme:light] dark:[color-scheme:dark]', className)}
    />
  );
}
