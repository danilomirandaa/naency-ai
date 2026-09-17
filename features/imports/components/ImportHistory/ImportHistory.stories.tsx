import { ImportHistory } from '@/features/imports/components/ImportHistory';
import { importHistoryFixture } from '@/features/imports/fixtures/imports';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ImportHistory> = {
  title: 'Features/Imports/ImportHistory',
  component: ImportHistory,
  args: { batches: importHistoryFixture, reviewHref: (id: string) => `/importar?lote=${id}` },
  render: (args) => (
    <div className="max-w-2xl">
      <ImportHistory {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof ImportHistory>;

export const Recent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'nubank-setembro.ofx' })).toHaveAttribute(
      'href',
      `/importar?lote=${importHistoryFixture[0]?.id}`,
    );
    await expect(canvas.queryByRole('link', { name: 'fatura-agosto.csv' })).toBeNull();
    await expect(canvas.getByText('Nubank Roxinho · 48 linhas · 01/09/2026')).toBeInTheDocument();
  },
};
