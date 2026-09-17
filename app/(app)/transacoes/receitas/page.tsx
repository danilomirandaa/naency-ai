import { TransactionsPage } from '@/features/transactions/containers/TransactionsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Receitas · Naency',
};

export default function Page({ searchParams }: PageProps<'/transacoes/receitas'>) {
  return <TransactionsPage kind="income" title="Receitas" searchParams={searchParams} />;
}
