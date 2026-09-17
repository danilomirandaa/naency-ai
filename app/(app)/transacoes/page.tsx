import { TransactionsPage } from '@/features/transactions/containers/TransactionsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transações · Naency',
};

export default function Page({ searchParams }: PageProps<'/transacoes'>) {
  return <TransactionsPage kind={null} title="Transações" searchParams={searchParams} />;
}
