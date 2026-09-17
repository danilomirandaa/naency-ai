import { AuthShell } from '@/components/layout/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';
import type { LoginState } from '@/features/auth/schemas';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

async function fakeSendMagicLink(_state: LoginState, formData: FormData): Promise<LoginState> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) {
    return { status: 'error', message: 'Informe um e-mail válido.', email };
  }
  if (email === 'limite@exemplo.com') {
    return {
      status: 'error',
      message: 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.',
      email,
    };
  }
  return { status: 'sent', email };
}

const meta: Meta<typeof LoginForm> = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  parameters: { layout: 'fullscreen' },
  args: { action: fn(fakeSendMagicLink) },
  decorators: [
    (Story) => (
      <AuthShell>
        <Story />
      </AuthShell>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('E-mail'), 'danilo@exemplo.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar link de acesso' }));

    await expect(await canvas.findByRole('heading', { name: 'Verifique seu e-mail' })).toBeVisible();
    await expect(canvas.getByText('danilo@exemplo.com')).toBeVisible();
    await expect(args.action).toHaveBeenCalledTimes(1);

    // "Usar outro e-mail" volta ao formulário vazio.
    await userEvent.click(canvas.getByRole('button', { name: 'Usar outro e-mail' }));
    await expect(canvas.getByLabelText('E-mail')).toHaveValue('');
  },
};

export const SendError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('E-mail');
    await userEvent.type(email, 'limite@exemplo.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar link de acesso' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(/Muitos envios/);
    await expect(email).toBeInvalid();
    // O e-mail digitado continua no campo depois do erro.
    await expect(canvas.getByLabelText('E-mail')).toHaveValue('limite@exemplo.com');
  },
};

export const ExpiredLink: Story = {
  args: { initialError: 'Esse link expirou ou já foi usado. Peça um novo.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(/expirou/);
  },
};

export const WithGoogle: Story = {
  args: { providers: ['google'], onProviderSignIn: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continuar com Google' }));
    await expect(args.onProviderSignIn).toHaveBeenCalledWith('google');
    // Sem foco residual: o screenshot visual é tirado depois do play.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const WithDestination: Story = {
  args: { next: '/cartoes' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('E-mail'), 'danilo@exemplo.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Enviar link de acesso' }));
    await canvas.findByRole('heading', { name: 'Verifique seu e-mail' });
    const formData = (args.action as ReturnType<typeof fn>).mock.calls[0]?.[1] as FormData;
    await expect(formData.get('next')).toBe('/cartoes');
    await userEvent.click(canvas.getByRole('button', { name: 'Usar outro e-mail' }));
  },
};
