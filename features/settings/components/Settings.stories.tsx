import { AiUsageCard } from '@/features/settings/components/AiUsageCard';
import { CreditsCard } from '@/features/settings/components/CreditsCard';
import { WorkspaceSettingsForm } from '@/features/settings/components/WorkspaceSettingsForm';
import type { RenameWorkspaceState } from '@/features/settings/actions';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta = {
  title: 'Features/Settings',
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

const rename = fn(async (_state: RenameWorkspaceState, formData: FormData): Promise<RenameWorkspaceState> => {
  const name = String(formData.get('name') ?? '');
  return name.trim().length < 2 ? { status: 'error', message: 'Use pelo menos 2 caracteres.', name } : { status: 'saved' };
});

export const RenameWorkspace: Story = {
  render: () => <WorkspaceSettingsForm name="Família Miranda" canManage action={rename} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Nome do espaço');
    await userEvent.clear(input);
    await userEvent.type(input, 'x');
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar' }));
    await expect(await canvas.findByText('Use pelo menos 2 caracteres.')).toBeInTheDocument();
    await expect(canvas.getByLabelText('Nome do espaço')).toHaveValue('x');
    await userEvent.clear(canvas.getByLabelText('Nome do espaço'));
    await userEvent.type(canvas.getByLabelText('Nome do espaço'), 'Casa');
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent('Nome salvo.');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const ViewerCannotRename: Story = {
  render: () => <WorkspaceSettingsForm name="Família Miranda" canManage={false} action={rename} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Nome do espaço')).toBeDisabled();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const AiEnabled: Story = {
  render: () => (
    <AiUsageCard
      enabled
      model="claude-opus-5"
      usage={{ month: '2026-09', items: [{ task: 'enrich', model: 'claude-opus-5', calls: 3, inputTokens: 12500, outputTokens: 2300 }] }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('12.500 tokens de entrada · 2.300 de saída')).toBeInTheDocument();
  },
};

export const AiDisabled: Story = {
  render: () => <AiUsageCard enabled={false} model="claude-opus-5" usage={{ month: '2026-09', items: [] }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nenhum uso em setembro de 2026.')).toBeInTheDocument();
  },
};

export const Credits: Story = {
  render: () => <CreditsCard />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    );
  },
};
