import { BalanceOverview } from '@/features/dashboard/components/BalanceOverview';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import { MonthResult, expenseTrend } from '@/features/dashboard/components/MonthResult';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions';
import { SetupChecklist } from '@/features/dashboard/components/SetupChecklist';
import { UpcomingBills } from '@/features/dashboard/components/UpcomingBills';
import {
  balanceFixture,
  categoryBreakdownFixture,
  evolutionFixture,
  monthResultFixture,
  recentFixture,
  upcomingFixture,
} from '@/features/dashboard/fixtures/dashboard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta = {
  title: 'Features/Dashboard/Blocks',
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const Balance: Story = {
  render: () => <BalanceOverview data={balanceFixture} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('R$ 29.306,40')).toBeInTheDocument();
    await expect(canvas.getByText('R$ 2.844,40')).toBeInTheDocument();
    await expect(within(canvas.getByRole('list', { name: 'Saldo por conta' })).getAllByRole('listitem')).toHaveLength(4);
  },
};

export const BalanceEmpty: Story = {
  render: () => <BalanceOverview data={{ availableCents: 0, cardsCents: 0, accounts: [] }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Cadastrar conta' })).toHaveAttribute('href', '/contas?nova=1');
  },
};

export const Result: Story = {
  render: () => <MonthResult data={monthResultFixture} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+R$ 2.376,60')).toBeInTheDocument();
    await expect(canvas.getByText('Despesas 13% maiores que no mês anterior')).toBeInTheDocument();
    await expect(expenseTrend(-90, -100)).toBe('Despesas 10% menores que no mês anterior');
    await expect(expenseTrend(-100, -100)).toBe('Despesas iguais às do mês anterior');
    await expect(expenseTrend(-100, 0)).toBeNull();
  },
};

export const Categories: Story = {
  render: () => (
    <CategoryBreakdown data={categoryBreakdownFixture} transactionsHref={(id) => `/transacoes?categoria=${id ?? ''}`} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = within(canvas.getByRole('list', { name: 'Despesas por categoria' }));
    await expect(list.getByText('Outras 2 categorias')).toBeInTheDocument();
    const moradia = canvas.getByRole('button', { name: 'Moradia' });
    await expect(moradia).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(moradia);
    await expect(canvas.getByRole('list', { name: 'Subcategorias de Moradia' })).toBeInTheDocument();
    await userEvent.click(moradia);
    await expect(canvas.queryByRole('list', { name: 'Subcategorias de Moradia' })).toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const Evolution: Story = {
  render: () => <MonthlyEvolution data={evolutionFixture} />,
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', { name: 'Receitas e despesas por mês' });
    await expect(within(table).getAllByRole('row')).toHaveLength(7);
    await expect(within(table).getByRole('rowheader', { name: 'Setembro de 2026' })).toBeInTheDocument();
  },
};

export const Upcoming: Story = {
  render: () => <UpcomingBills data={upcomingFixture} today="2026-09-16" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/venceu há 2 dias/)).toBeInTheDocument();
    await expect(canvas.getByText('Atrasado')).toBeInTheDocument();
    await expect(canvas.getByText(/vence amanhã/)).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Fatura Nubank Roxinho' })).toHaveAttribute(
      'href',
      '/cartoes/0000000c-0000-4000-8000-000000000001?fatura=2026-10',
    );
  },
};

export const Recent: Story = {
  render: () => <RecentTransactions data={recentFixture} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Ana Paula · Nubank · 15/09/2026')).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/transacoes');
  },
};

export const Setup: Story = {
  render: () => <SetupChecklist canEdit progress={{ hasAccount: true, hasTransaction: false, hasOtherMember: false }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Faltam 2 passos')).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Importar' })).toHaveAttribute('href', '/importar');
    await expect(canvas.queryByRole('link', { name: 'Cadastrar' })).toBeNull();
  },
};

export const SetupDoneOrViewer: Story = {
  render: () => (
    <>
      <SetupChecklist canEdit progress={{ hasAccount: true, hasTransaction: true, hasOtherMember: true }} />
      <SetupChecklist canEdit={false} progress={{ hasAccount: false, hasTransaction: false, hasOtherMember: false }} />
      <p>fim</p>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('Complete sua configuração')).toBeNull();
  },
};

export const LoadingAndError: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <DashboardCard title="Carregando" isLoading>
        {null}
      </DashboardCard>
      <DashboardCard title="Com erro" isError>
        {null}
      </DashboardCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Não foi possível carregar')).toBeInTheDocument();
  },
};
