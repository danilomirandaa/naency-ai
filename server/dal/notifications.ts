import 'server-only';
import type { NotificationItem } from '@/features/notifications/types';
import { invoiceStatus } from '@/lib/cards';
import { formatIsoDate, formatMonth, todayIsoDate } from '@/lib/dates';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { accounts, cardInvoices, importBatches, transactions } from '@/server/db/schema';
import { and, count, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';

/** Quanto tempo uma importação concluída continua aparecendo no sino. */
const IMPORT_WINDOW_DAYS = 7;

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Avisos do espaço, montados a partir dos dados: importações que terminaram,
 * contas atrasadas e faturas a vencer. Não existe tabela de notificação — assim
 * a lista nunca fica dessincronizada do que realmente aconteceu.
 */
export async function listNotifications(
  workspaceId: string,
  { today = todayIsoDate() }: { today?: string } = {},
): Promise<NotificationItem[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const db = getDb();
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - IMPORT_WINDOW_DAYS * 86_400_000);

  const [imports, [overdue], invoices] = await Promise.all([
    db
      .select({
        id: importBatches.id,
        fileName: importBatches.fileName,
        status: importBatches.status,
        jobError: importBatches.jobError,
        finishedAt: importBatches.jobFinishedAt,
        accountName: accounts.name,
      })
      .from(importBatches)
      .innerJoin(accounts, eq(accounts.id, importBatches.accountId))
      .where(and(eq(importBatches.workspaceId, workspaceId), gte(importBatches.jobFinishedAt, since)))
      .orderBy(desc(importBatches.jobFinishedAt))
      .limit(10),
    db
      .select({ total: count(), oldest: sql<string | null>`min(${transactions.date})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          isNull(transactions.deletedAt),
          eq(transactions.status, 'planned'),
          lt(transactions.date, today),
        ),
      ),
    db
      .select({
        id: cardInvoices.id,
        referenceMonth: cardInvoices.referenceMonth,
        closingDate: cardInvoices.closingDate,
        dueDate: cardInvoices.dueDate,
        paidAt: cardInvoices.paidAt,
        accountId: cardInvoices.accountId,
        accountName: accounts.name,
      })
      .from(cardInvoices)
      .innerJoin(accounts, eq(accounts.id, cardInvoices.accountId))
      .where(and(eq(cardInvoices.workspaceId, workspaceId), isNull(cardInvoices.paidAt)))
      .orderBy(desc(cardInvoices.dueDate))
      .limit(10),
  ]);

  const items: NotificationItem[] = imports.map((batch) => {
    const at = (batch.finishedAt ?? new Date()).toISOString();
    if (batch.jobError) {
      return {
        id: `import-error-${batch.id}-${at}`,
        kind: 'import-error' as const,
        title: 'A importação não terminou',
        description: `${batch.fileName}: ${batch.jobError}`,
        icon: 'alert-circle' as const,
        href: `/importar?lote=${batch.id}`,
        at,
      };
    }
    return {
      id: `import-${batch.id}-${at}`,
      kind: 'import' as const,
      title: batch.status === 'committed' ? 'Importação concluída' : 'Sugestões prontas',
      description:
        batch.status === 'committed'
          ? `${batch.fileName} entrou em ${batch.accountName}.`
          : `A AI terminou de ler ${batch.fileName}. Revise antes de importar.`,
      icon: 'upload' as const,
      href: batch.status === 'committed' ? '/transacoes' : `/importar?lote=${batch.id}`,
      at,
    };
  });

  if (overdue && overdue.total > 0) {
    items.push({
      id: `overdue-${today}-${overdue.total}`,
      kind: 'overdue',
      title: plural(overdue.total, 'conta atrasada', 'contas atrasadas'),
      description: overdue.oldest ? `A mais antiga venceu em ${formatIsoDate(overdue.oldest)}.` : 'Vencidas e não pagas.',
      icon: 'alert-circle',
      href: '/transacoes?situacao=atrasadas',
      at: `${today}T00:00:00.000Z`,
    });
  }

  for (const invoice of invoices) {
    if (invoiceStatus({ closingDate: invoice.closingDate, paidAt: invoice.paidAt }, today) !== 'closed') {
      continue;
    }
    items.push({
      id: `invoice-${invoice.id}`,
      kind: 'invoice',
      title: `Fatura de ${formatMonth(invoice.referenceMonth).toLowerCase()} fechada`,
      description: `${invoice.accountName}: vence em ${formatIsoDate(invoice.dueDate)}.`,
      icon: 'credit-card',
      href: `/cartoes/${invoice.accountId}?fatura=${invoice.referenceMonth}`,
      at: `${invoice.closingDate}T00:00:00.000Z`,
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}
