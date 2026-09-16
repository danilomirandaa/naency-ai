import { AuthShell } from '@/components/layout/AuthShell';
import { sendMagicLinkAction } from '@/features/auth/actions';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { getLoginCallbackErrorMessage } from '@/features/auth/schemas';
import { sanitizeNextPath } from '@/lib/auth/routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar · Naency',
};

export default async function LoginPage({ searchParams }: PageProps<'/entrar'>) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const next = sanitizeNextPath(first(params.next));

  return (
    <AuthShell>
      <LoginForm
        action={sendMagicLinkAction}
        next={next === '/' ? undefined : next}
        initialError={getLoginCallbackErrorMessage(first(params.erro))}
      />
    </AuthShell>
  );
}
