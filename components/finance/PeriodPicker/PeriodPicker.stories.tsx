import { PeriodPicker } from '@/components/finance/PeriodPicker';
import type { DateRange } from '@/lib/periods';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

const onChange = fn();

function Demo({ initial }: { initial: DateRange }) {
  const [range, setRange] = React.useState(initial);
  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker
        value={range}
        today="2026-09-16"
        onValueChange={(next) => {
          onChange(next);
          setRange(next);
        }}
      />
      <output aria-label="Intervalo">{`${range.from} → ${range.to}`}</output>
    </div>
  );
}

const meta: Meta = {
  title: 'Finance/PeriodPicker',
  beforeEach: () => {
    onChange.mockClear();
  },
};
export default meta;
type Story = StoryObj;

export const MonthAndYearNavigation: Story = {
  render: () => <Demo initial={{ from: '2026-09-01', to: '2026-09-30' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Setembro de 2026')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Mês anterior' }));
    await expect(canvas.getByLabelText('Intervalo')).toHaveTextContent('2026-08-01 → 2026-08-31');
    await userEvent.click(canvas.getByRole('button', { name: 'Próximo ano' }));
    await expect(canvas.getByLabelText('Intervalo')).toHaveTextContent('2027-08-01 → 2027-08-31');
    await expect(canvas.getByRole('button', { name: 'Filtre por' })).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Presets: Story = {
  render: () => <Demo initial={{ from: '2026-09-01', to: '2026-09-30' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Filtre por' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Esta semana' }));
    await expect(onChange).toHaveBeenLastCalledWith({ from: '2026-09-13', to: '2026-09-19' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    // Botão mostra o atalho ativo; o mês exibido continua o de início.
    await expect(canvas.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
    await expect(canvas.getByText('Setembro de 2026')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Esta semana' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Limpar filtro' }));
    await expect(onChange).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const CustomRange: Story = {
  render: () => <Demo initial={{ from: '2026-09-01', to: '2026-09-30' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Escolher intervalo de datas' }));
    const calendar = within(await screen.findByRole('dialog', { name: 'Intervalo de datas' }));
    await userEvent.click(calendar.getByRole('button', { name: /10 de setembro de 2026/ }));
    await userEvent.click(calendar.getByRole('button', { name: /14 de outubro de 2026/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(onChange).toHaveBeenLastCalledWith({ from: '2026-09-10', to: '2026-10-14' });
    await expect(canvas.getByRole('button', { name: '10/09 – 14/10/2026' })).toBeInTheDocument();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
