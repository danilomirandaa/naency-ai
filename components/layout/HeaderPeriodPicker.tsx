'use client';

import { PeriodPicker } from '@/components/finance/PeriodPicker';
import { usePeriod } from '@/hooks/usePeriod';
import { isPeriodPath } from '@/lib/periods';
import { usePathname } from 'next/navigation';

export type HeaderPeriodPickerProps = {
  periodCookie: string | null;
  today: string;
};

/** Período global no header, só nas telas que usam período. */
export function HeaderPeriodPicker({ periodCookie, today }: HeaderPeriodPickerProps) {
  const pathname = usePathname();
  const { range, setRange } = usePeriod(periodCookie);
  if (!isPeriodPath(pathname)) {
    return null;
  }
  return <PeriodPicker value={range} onValueChange={setRange} today={today} className="flex-nowrap" />;
}
