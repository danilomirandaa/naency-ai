'use client';

import { Icon, type Icons } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { classMerge } from '@/lib/utils';
import * as ToastPrimitive from '@radix-ui/react-toast';
import * as React from 'react';

export type ToastVariant = 'neutral' | 'success' | 'critical';

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milissegundos na tela; `Number.POSITIVE_INFINITY` fica até fechar. */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

const ToastContext = React.createContext<((toast: ToastInput) => void) | null>(null);

/** Avisa o que terminou. Use para resultado de processo, não para validação de campo. */
export function useToast() {
  const show = React.useContext(ToastContext);
  if (!show) {
    throw new Error('useToast precisa do <Toast.Provider> (app/(app)/providers.tsx)');
  }
  return show;
}

const VARIANT_ICON: Record<ToastVariant, Icons> = {
  neutral: 'info-icon',
  success: 'check',
  critical: 'alert-circle',
};

const VARIANT_COLOR: Record<ToastVariant, string> = {
  neutral: 'text-icon-neutral-rest',
  success: 'text-icon-finance-income',
  critical: 'text-icon-status-critical-rest',
};

export type ToastProviderProps = {
  children: React.ReactNode;
  /** Padrão de tempo na tela; cada aviso pode sobrescrever. */
  duration?: number;
};

export function ToastProvider({ children, duration = 6_000 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const show = React.useCallback((toast: ToastInput) => {
    nextId.current += 1;
    setToasts((current) => [...current, { ...toast, id: nextId.current }]);
  }, []);

  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={show}>
      <ToastPrimitive.Provider duration={duration} swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            duration={toast.duration}
            onOpenChange={(open) => !open && dismiss(toast.id)}
            className={classMerge(
              'flex items-start gap-3 rounded-control-lg border border-border-neutral-subtle bg-background-neutral-000 p-3 shadow-panel-body dark:shadow-panel-body-dark',
              'data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-2 data-[state=open]:animate-in',
              'data-[state=closed]:fade-out-0 data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0',
            )}
          >
            <Icon
              icon={VARIANT_ICON[toast.variant ?? 'neutral']}
              className={classMerge('mt-0.5 size-4 shrink-0', VARIANT_COLOR[toast.variant ?? 'neutral'])}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <ToastPrimitive.Title asChild>
                <Text size="sm" weight="medium">
                  {toast.title}
                </Text>
              </ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description asChild>
                  <Text size="xs" color="secondary">
                    {toast.description}
                  </Text>
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label="Fechar aviso"
              className="rounded-control-sm p-1 text-icon-neutral-rest outline-hidden transition-colors hover:bg-background-neutral-100 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon="close" className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[60] flex w-full max-w-[380px] flex-col gap-2 p-4 outline-hidden" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
ToastProvider.displayName = 'Toast.Provider';

export const Toast = { Provider: ToastProvider };
