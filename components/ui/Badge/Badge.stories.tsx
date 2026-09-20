import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  args: { children: 'Em atraso' },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Badge>;

/** As três situações de um lançamento, na ordem de urgência. */
export const Situations: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="solid" tone="critical">
        Em atraso
      </Badge>
      <Badge variant="outline" tone="critical">
        A pagar
      </Badge>
      <Badge>
        <Icon icon="check-double" aria-hidden />
        Paga
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Em atraso')).toBeInTheDocument();
    await expect(canvas.getByText('A pagar')).toBeInTheDocument();
    await expect(canvas.getByText('Paga')).toBeInTheDocument();
  },
};

/** Rótulos neutros da tabela: conta, categoria e forma de pagamento. */
export const Labels: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Nubank</Badge>
      <Badge>
        <Icon icon="recurring" aria-hidden />
        Recorrente
      </Badge>
      <Badge>Parcela 2/10</Badge>
      <Badge>Boleto</Badge>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['solid', 'outline', 'neutral'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          {(['critical', 'success', 'neutral'] as const).map((tone) => (
            <Badge key={tone} variant={variant} tone={tone}>
              {variant} · {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
