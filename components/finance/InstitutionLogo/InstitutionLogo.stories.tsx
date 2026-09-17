import { InstitutionLogo } from '@/components/finance/InstitutionLogo';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

/** Mesmo catálogo da migration 0002_seed_institutions.sql. */
const catalog = [
  { name: 'Nubank', color: '#820AD1' },
  { name: 'Itaú', color: '#EC7000' },
  { name: 'Inter', color: '#FF7A00' },
  { name: 'C6 Bank', color: '#242424' },
  { name: 'Banco do Brasil', color: '#FCFC30' },
  { name: 'Caixa', color: '#005CA9' },
  { name: 'Bradesco', color: '#CC092F' },
  { name: 'Santander', color: '#EC0000' },
  { name: 'XP Investimentos', color: '#000000' },
  { name: 'Dinheiro/Carteira', color: '#2E7D32' },
];

const meta: Meta<typeof InstitutionLogo> = {
  title: 'Finance/InstitutionLogo',
  component: InstitutionLogo,
};

export default meta;

type Story = StoryObj<typeof InstitutionLogo>;

export const Catalog: Story = {
  render: () => (
    <ul className="grid max-w-md grid-cols-2 gap-3">
      {catalog.map((institution) => (
        <li key={institution.name} className="flex items-center gap-2">
          <InstitutionLogo {...institution} />
          <Text size="sm">{institution.name}</Text>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(catalog.length);
    // Decorativo: o nome ao lado já identifica a instituição.
    await expect(canvas.getByText('BB')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <InstitutionLogo name="Nubank" color="#820AD1" size="sm" />
      <InstitutionLogo name="Nubank" color="#820AD1" size="md" />
    </div>
  ),
};
