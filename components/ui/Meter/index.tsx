import { classMerge } from '@/lib/utils';

export type MeterProps = {
  value: number;
  max: number;
  /** Nome para leitores de tela. */
  label: string;
  /** Texto anunciado, ex.: "36% do limite usado". */
  valueText?: string;
  /**
   * `usage`: quanto mais cheio, pior (verde → amarelo em 70% → vermelho em 90%).
   * `progress`: quanto mais cheio, melhor (sempre na cor da marca).
   */
  tone?: 'usage' | 'progress';
  className?: string;
};

/** Barra de progresso acessível (role="meter"). */
export function Meter({ value, max, label, valueText, tone = 'usage', className }: MeterProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : value > 0 ? 1 : 0;
  const percent = Math.round(ratio * 100);
  const color =
    tone === 'progress'
      ? 'bg-button-brand-primary-rest'
      : ratio >= 0.9
        ? 'bg-background-status-critical-rest'
        : ratio >= 0.7
          ? 'bg-background-status-warning-rest'
          : 'bg-button-brand-primary-rest';

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText ?? `${percent}%`}
      className={classMerge('h-1.5 w-full overflow-hidden rounded-full bg-background-neutral-200', className)}
    >
      <div className={classMerge('h-full rounded-full transition-[width]', color)} style={{ width: `${percent}%` }} />
    </div>
  );
}
