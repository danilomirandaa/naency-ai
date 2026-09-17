import { TransactionsPage } from '@/features/transactions/containers/TransactionsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transferências · Naency',
};

export default function Page({ searchParams }: PageProps<'/transacoes/transferencias'>) {
  return <TransactionsPage kind="transfer" title="Transferências" searchParams={searchParams} />;
}
