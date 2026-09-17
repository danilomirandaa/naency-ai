import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { ImportUploadForm } from '@/features/imports/components/ImportUploadForm';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof ImportUploadForm> = {
  title: 'Features/Imports/ImportUploadForm',
  component: ImportUploadForm,
  args: {
    accounts: accountsFixture,
    onSubmit: fn(async (input) =>
      input.text.includes('<OFX>')
        ? { ok: true as const, batchId: 'lote' }
        : { ok: false as const, message: 'Não reconhecemos as colunas deste CSV.' },
    ),
    onCreated: fn(),
  },
  render: (args) => (
    <div className="max-w-xl">
      <ImportUploadForm {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof ImportUploadForm>;

export const ReadsFile: Story = {
  args: { defaultAccountId: accountsFixture[0]?.id },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error('input de arquivo não encontrado');
    }
    await userEvent.upload(input, new File(['<OFX><STMTTRN>…</OFX>'], 'extrato.ofx', { type: 'application/x-ofx' }));
    await expect(canvas.getByText('extrato.ofx')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Ler extrato' }));
    await expect(args.onCreated).toHaveBeenCalledWith('lote');
    await expect(args.onSubmit).toHaveBeenCalledWith({
      accountId: accountsFixture[0]?.id,
      fileName: 'extrato.ofx',
      text: '<OFX><STMTTRN>…</OFX>',
    });
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const ShowsParseError: Story = {
  args: { defaultAccountId: accountsFixture[0]?.id },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['a;b\n1;2'], 'estranho.csv', { type: 'text/csv' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Ler extrato' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Não reconhecemos as colunas');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const RequiresAccountAndFile: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Ler extrato' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Escolha a conta do extrato.');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
