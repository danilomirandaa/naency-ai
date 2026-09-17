import { TransactionsPage } from '@/features/transactions/containers/TransactionsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Despesas · Naency',
};

export default function Page({ searchParams }: PageProps<'/transacoes/despesas'>) {
  return <TransactionsPage kind="expense" title="Despesas" searchParams={searchParams} />;
}
