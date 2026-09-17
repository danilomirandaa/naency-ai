'use client';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { classMerge } from '@/lib/utils';
import * as React from 'react';

export type CopyInputProps = Omit<React.ComponentProps<'input'>, 'value' | 'readOnly'> & {
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
};

/** Campo somente leitura com botão de copiar (links de convite, chaves). */
export function CopyInput({
  value,
  copyLabel = 'Copiar',
  copiedLabel = 'Copiado',
  className,
  ...props
}: CopyInputProps) {
  const [status, setStatus] = React.useState<'idle' | 'copied' | 'failed'>('idle');

  React.useEffect(() => {
    if (status === 'idle') {
      return;
    }
    const timeout = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <div className={classMerge('flex items-center gap-2', className)}>
      <Input
        {...props}
        value={value}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
        className="font-mono text-xs"
      />
      <Button variant="outline" onClick={copy} aria-live="polite">
        <Icon icon={status === 'copied' ? 'check' : 'copy'} data-icon="inline-start" />
        {status === 'copied' ? copiedLabel : status === 'failed' ? 'Selecione e copie' : copyLabel}
      </Button>
    </div>
  );
}
