'use client';

import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Separator } from '@/components/ui/Separator';
import { Text } from '@/components/ui/Text';
import { type LoginState, initialLoginState } from '@/features/auth/schemas';
import * as React from 'react';

export type LoginProvider = 'google';

const providerMeta: Record<LoginProvider, { label: string; icon: Icons }> = {
  google: { label: 'Continuar com Google', icon: 'google' },
};

export type LoginFormProps = {
  /** Server Action de envio do link (sendMagicLinkAction no app, falsa nas stories). */
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  /** Destino depois de entrar (repassado ao link). */
  next?: string;
  /** Erro vindo do callback (/entrar?erro=...). */
  initialError?: string | null;
  /** Provedores sociais habilitados no Supabase. Vazio esconde a seção. */
  providers?: LoginProvider[];
  onProviderSignIn?: (provider: LoginProvider) => void;
};

export function LoginForm(props: LoginFormProps) {
  // Trocar a key reinicia o formulário ("usar outro e-mail").
  const [attempt, setAttempt] = React.useState(0);
  return (
    <LoginFormAttempt
      key={attempt}
      {...props}
      initialError={attempt === 0 ? props.initialError : null}
      onReset={() => setAttempt((value) => value + 1)}
    />
  );
}

function LoginHeading({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Text element="h1" size="3xl" weight="semibold" className="tracking-tight">
        {title}
      </Text>
      <Text element="p" size="base" color="secondary">
        {description}
      </Text>
    </div>
  );
}

function LoginFormAttempt({
  action,
  next,
  initialError,
  providers = [],
  onProviderSignIn,
  onReset,
}: LoginFormProps & { onReset: () => void }) {
  const [state, formAction, isPending] = React.useActionState(action, initialLoginState);
  const error = state.status === 'error' ? state.message : initialError;

  return (
    <div className="flex flex-col gap-8">
      <BrandMark variant="icon" />

      {state.status === 'sent' ? (
        <div className="flex flex-col gap-6" aria-live="polite">
          <LoginHeading
            title="Verifique seu e-mail"
            description={
              <>
                Enviamos um link de acesso para{' '}
                <Text weight="medium" color="primary">
                  {state.email}
                </Text>
                .
              </>
            }
          />
          <Text element="p" size="sm" color="secondary">
            Não chegou? Veja a caixa de spam ou peça outro link.
          </Text>
          <Button variant="outline" size="lg" onClick={onReset}>
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <LoginHeading
            title="Entrar"
            description="Informe seu e-mail para receber um link de acesso."
          />

          <form action={formAction} className="flex flex-col gap-4" noValidate>
            {next && <input type="hidden" name="next" value={next} />}
            <Field label="E-mail" description="O link de acesso vale por 1 hora.">
              {(control) => (
                <Input
                  {...control}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  defaultValue={state.status === 'error' ? state.email : undefined}
                  required
                  aria-invalid={error ? true : undefined}
                />
              )}
            </Field>
            {error && (
              <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
                {error}
              </Panel.Callout>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full"
            >
              {isPending && <Spinner label={null} data-icon="inline-start" />}
              {isPending ? 'Enviando…' : 'Enviar link de acesso'}
              {!isPending && <Icon icon="arrow-right" data-icon="inline-end" />}
            </Button>
          </form>

          {providers.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <Text size="xs" color="secondary">
                  ou continue com
                </Text>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-col gap-3">
                {providers.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => onProviderSignIn?.(provider)}
                  >
                    <Icon icon={providerMeta[provider].icon} data-icon="inline-start" />
                    {providerMeta[provider].label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
