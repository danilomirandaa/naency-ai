import { ImportSummary } from '@/features/imports/components/ImportSummary';
import { importBatchFixture } from '@/features/imports/fixtures/imports';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof ImportSummary> = {
  title: 'Features/Imports/ImportSummary',
  component: ImportSummary,
  args: { batch: importBatchFixture, canEdit: true, onCommit: fn(async () => {}), onDiscard: fn(async () => {}) },
  render: (args) => (
    <div className="max-w-4xl">
      <ImportSummary {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof ImportSummary>;

export const Reviewing: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/2 lançamentos a importar de 3 · 1 duplicado · 1 sem categoria/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Importar 2' }));
    await expect(args.onCommit).toHaveBeenCalledOnce();
    // Descartar pede confirmação: cancelar não descarta.
    await userEvent.click(canvas.getByRole('button', { name: 'Descartar' }));
    let dialog = await screen.findByRole('dialog', { name: 'Descartar importação' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onDiscard).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Descartar' }));
    dialog = await screen.findByRole('dialog', { name: 'Descartar importação' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Descartar' }));
    await expect(args.onDiscard).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Processing: Story = {
  args: { batch: { ...importBatchFixture, job: 'suggest' }, onSuggest: fn(async () => {}) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Trabalho rodando no servidor: botões travados e aviso de que dá para sair.
    await expect(canvas.getByRole('button', { name: 'Sugerindo…' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: /Importar/ })).toBeDisabled();
    await expect(canvas.getByText(/Pode fechar a página/)).toBeInTheDocument();
  },
};

export const Committed: Story = {
  args: { batch: { ...importBatchFixture, status: 'committed' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Importado')).toBeInTheDocument();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const NothingIncluded: Story = {
  args: {
    batch: { ...importBatchFixture, summary: { ...importBatchFixture.summary, included: 0 } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Importar 0' })).toBeDisabled();
  },
};

export const WithAi: Story = {
  args: { onSuggest: fn(async () => {}) },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Sugerir com AI' }));
    await expect(args.onSuggest).toHaveBeenCalledOnce();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
