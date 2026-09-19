import { BalanceOverview } from '@/features/dashboard/components/BalanceOverview';
import { Cashflow, extremes } from '@/features/dashboard/components/Cashflow';
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown';
import { DashboardCard } from '@/features/dashboard/components/DashboardCard';
import { MonthlyBalance, balanceSummary } from '@/features/dashboard/components/MonthlyBalance';
import { barWidth } from '@/features/dashboard/components/MonthlyBalanceBars';
import { MonthlyEvolution } from '@/features/dashboard/components/MonthlyEvolution';
import { PeriodSummary, percentChange } from '@/features/dashboard/components/PeriodSummary';
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions';
import { SetupChecklist } from '@/features/dashboard/components/SetupChecklist';
import { UpcomingBills } from '@/features/dashboard/components/UpcomingBills';
import {
  balanceFixture,
  cashflowFixture,
  cashflowNegativeFixture,
  categoryBreakdownFixture,
  evolutionFixture,
  evolutionWithDeficitFixture,
  monthResultFixture,
  recentFixture,
  upcomingFixture,
} from '@/features/dashboard/fixtures/dashboard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta = {
  title: 'Features/Dashboard/Blocks',
  decorators: [
    // Blocos de coluna cabem em max-w-xl; a faixa do topo ocupa a largura da tela.
    (Story, { parameters }) => (
      <div className={parameters.wide ? 'max-w-5xl' : 'max-w-xl'}>
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
  parameters: { wide: true },
  render: () => (
    <PeriodSummary
      result={monthResultFixture}
      balances={balanceFixture}
      transactionsHref={(kind) => `/transacoes/${kind ?? ''}`}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/\+R\$.2\.376,60/)).toBeInTheDocument();
    // Receita igual ao mês anterior não ganha seta; despesa maior é má notícia.
    await expect(canvas.getByText('igual')).toBeInTheDocument();
    await expect(canvas.getByText('+13%')).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /Saldo em contas/ })).toHaveAttribute('href', '/contas');
    await expect(percentChange(-90, -100)).toBe(-10);
    await expect(percentChange(-100, 0)).toBeNull();
  },
};

export const ResultWithoutBalance: Story = {
  parameters: { wide: true },
  render: () => <PeriodSummary result={monthResultFixture} withBalance={false} />,
  play: async ({ canvasElement }) => {
    // Em Relatórios o saldo não entra: a tela fala só do período.
    await expect(within(canvasElement).queryByText('Saldo em contas')).toBeNull();
  },
};

export const CashflowBlock: Story = {
  render: () => <Cashflow data={cashflowFixture} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = within(canvas.getByLabelText('Resumo do período'));
    await expect(summary.getByText(/\+R\$.2\.377,60/)).toBeInTheDocument();
    // O melhor e o pior dia explicam os degraus da curva.
    await expect(summary.getByText(/\+R\$.8\.175,50/)).toBeInTheDocument();
    await expect(summary.getByText(/-R\$.2\.389,90/)).toBeInTheDocument();
    // A tabela para leitores de tela só lista os dias com movimento.
    const table = canvas.getByRole('table', { name: 'O que sobrou a cada dia do período' });
    await expect(within(table).getAllByRole('row')).toHaveLength(11);
    await expect(extremes([])).toBeNull();
  },
};

export const CashflowNegative: Story = {
  render: () => <Cashflow data={cashflowNegativeFixture} />,
  play: async ({ canvasElement }) => {
    const summary = within(within(canvasElement).getByLabelText('Resumo do período'));
    await expect(summary.getByText(/-R\$.4\.622,40/)).toBeInTheDocument();
  },
};

export const CashflowEmpty: Story = {
  render: () => <Cashflow data={[]} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Sem lançamentos no período')).toBeInTheDocument();
  },
};

export const MonthlyBalanceBlock: Story = {
  render: () => <MonthlyBalance data={evolutionFixture} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = within(canvas.getByLabelText('Resumo dos meses'));
    await expect(summary.getByText(/\+R\$.2\.219,93/)).toBeInTheDocument();
    await expect(summary.getByText('6 de 6 meses')).toBeInTheDocument();
    // Com tudo no azul, o melhor mês é agosto.
    await expect(summary.getByText('Agosto de 2026')).toBeInTheDocument();
    // Uma linha por mês, com o valor escrito ao lado da barra.
    const list = within(canvas.getByRole('list', { name: 'Resultado por mês' }));
    await expect(list.getAllByRole('listitem')).toHaveLength(6);
    await expect(list.getByText(/\+R\$.3\.100,00/)).toBeInTheDocument();
    await expect(balanceSummary([])).toBeNull();
    // A maior barra ocupa metade do trilho (o lado dela inteiro).
    await expect(barWidth(-310_000, 310_000)).toBe(50);
    await expect(barWidth(155_000, 310_000)).toBe(25);
    await expect(barWidth(100, 0)).toBe(0);
  },
};

export const MonthlyBalanceWithDeficit: Story = {
  render: () => <MonthlyBalance data={evolutionWithDeficitFixture} />,
  play: async ({ canvasElement }) => {
    const summary = within(within(canvasElement).getByLabelText('Resumo dos meses'));
    // Dois meses no vermelho derrubam a média, mas ela segue positiva.
    await expect(summary.getByText(/\+R\$.586,60/)).toBeInTheDocument();
    await expect(summary.getByText('4 de 6 meses')).toBeInTheDocument();
    const list = within(within(canvasElement).getByRole('list', { name: 'Resultado por mês' }));
    await expect(list.getByText(/-R\$.3\.582,00/)).toBeInTheDocument();
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
