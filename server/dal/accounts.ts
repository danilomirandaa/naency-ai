import 'server-only';
import { type AccountInputRaw, accountInputSchema } from '@/features/accounts/schemas';
import type { AccountSummary, InstitutionSummary } from '@/features/accounts/types';
import { requireMembership } from '@/server/auth/membership';
import { accountMovementSql } from '@/server/dal/transactions';
import { getDb } from '@/server/db/client';
import { accounts, creditCardDetails, institutions } from '@/server/db/schema';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { z } from 'zod';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export class AccountError extends Error {
  constructor(
    public readonly code: 'not-found' | 'invalid-institution' | 'invalid-payment-account' | 'type-change',
    message: string,
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

/** Instituições que o espaço pode usar: catálogo global + as cadastradas por ele. */
function visibleInstitutions(workspaceId: string) {
  return or(isNull(institutions.workspaceId), eq(institutions.workspaceId, workspaceId));
}

export async function listInstitutions(workspaceId: string): Promise<InstitutionSummary[]> {
  await requireMembership(workspaceId, 'workspace.read');
  return getDb()
    .select({
      id: institutions.id,
      name: institutions.name,
      kind: institutions.kind,
      color: institutions.color,
    })
    .from(institutions)
    .where(visibleInstitutions(workspaceId))
    .orderBy(asc(institutions.name));
}

export async function listAccounts(
  workspaceId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<AccountSummary[]> {
  await requireMembership(workspaceId, 'workspace.read');
  const rows = await getDb()
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalanceCents: accounts.initialBalanceCents,
      initialBalanceDate: accounts.initialBalanceDate,
      archivedAt: accounts.archivedAt,
      institutionId: institutions.id,
      institutionName: institutions.name,
      institutionColor: institutions.color,
      movementCents: accountMovementSql(),
      closingDay: creditCardDetails.closingDay,
      dueDay: creditCardDetails.dueDay,
      limitCents: creditCardDetails.limitCents,
      defaultPaymentAccountId: creditCardDetails.defaultPaymentAccountId,
    })
    .from(accounts)
    .leftJoin(institutions, eq(institutions.id, accounts.institutionId))
    .leftJoin(creditCardDetails, eq(creditCardDetails.accountId, accounts.id))
    .where(
      and(
        eq(accounts.workspaceId, workspaceId),
        includeArchived ? undefined : isNull(accounts.archivedAt),
      ),
    );

  // Ordem em pt-BR; o Postgres do Supabase usa collation C.
  rows.sort((a, b) => collator.compare(a.name, b.name));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    institution:
      row.institutionId && row.institutionName && row.institutionColor
        ? { id: row.institutionId, name: row.institutionName, color: row.institutionColor }
        : null,
    initialBalanceCents: row.initialBalanceCents,
    initialBalanceDate: row.initialBalanceDate,
    balanceCents: row.initialBalanceCents + Number(row.movementCents),
    archived: row.archivedAt !== null,
    card:
      row.type === 'credit_card' && row.closingDay !== null && row.dueDay !== null
        ? {
            closingDay: row.closingDay,
            dueDay: row.dueDay,
            limitCents: row.limitCents,
            defaultPaymentAccountId: row.defaultPaymentAccountId,
          }
        : null,
  }));
}

/** Impede ligar a conta a uma instituição cadastrada por outro espaço. */
async function assertInstitutionVisible(workspaceId: string, institutionId: string | null) {
  if (!institutionId) {
    return;
  }
  const [found] = await getDb()
    .select({ id: institutions.id })
    .from(institutions)
    .where(and(eq(institutions.id, institutionId), visibleInstitutions(workspaceId)));
  if (!found) {
    throw new AccountError('invalid-institution', 'Instituição não encontrada.');
  }
}

type ParsedAccount = ReturnType<typeof accountInputSchema.parse>;

function accountColumns(data: ParsedAccount) {
  const { closingDay, dueDay, limitCents, defaultPaymentAccountId, ...columns } = data;
  void closingDay;
  void dueDay;
  void limitCents;
  void defaultPaymentAccountId;
  return columns;
}

/** Conta de pagamento do cartão: do mesmo espaço, não é cartão e não é o próprio cartão. */
async function assertPaymentAccount(workspaceId: string, data: ParsedAccount, selfId?: string) {
  if (data.type !== 'credit_card' || !data.defaultPaymentAccountId) {
    return;
  }
  const [found] = await getDb()
    .select({ id: accounts.id, type: accounts.type })
    .from(accounts)
    .where(and(eq(accounts.id, data.defaultPaymentAccountId), eq(accounts.workspaceId, workspaceId)));
  if (!found || found.type === 'credit_card' || found.id === selfId) {
    throw new AccountError('invalid-payment-account', 'Escolha uma conta que não seja cartão para pagar a fatura.');
  }
}

type AccountsTx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0];

async function saveCardDetails(tx: AccountsTx, accountId: string, data: ParsedAccount) {
  if (data.type !== 'credit_card' || data.closingDay === null || data.dueDay === null) {
    return;
  }
  const details = {
    closingDay: data.closingDay,
    dueDay: data.dueDay,
    limitCents: data.limitCents,
    defaultPaymentAccountId: data.defaultPaymentAccountId,
  };
  await tx
    .insert(creditCardDetails)
    .values({ accountId, ...details })
    .onConflictDoUpdate({ target: creditCardDetails.accountId, set: details });
}

export async function createAccount(workspaceId: string, input: AccountInputRaw) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const data = accountInputSchema.parse(input);
  await assertInstitutionVisible(workspaceId, data.institutionId);
  await assertPaymentAccount(workspaceId, data);

  return getDb().transaction(async (tx) => {
    const [account] = await tx
      .insert(accounts)
      .values({ ...accountColumns(data), workspaceId, createdBy: user.id, updatedBy: user.id })
      .returning({ id: accounts.id });
    if (!account) {
      throw new Error('Falha ao criar a conta.');
    }
    await saveCardDetails(tx, account.id, data);
    return account;
  });
}

export async function updateAccount(workspaceId: string, accountId: string, input: AccountInputRaw) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const data = accountInputSchema.parse(input);
  await assertInstitutionVisible(workspaceId, data.institutionId);
  await assertPaymentAccount(workspaceId, data, accountId);

  return getDb().transaction(async (tx) => {
    const [current] = await tx
      .select({ type: accounts.type })
      .from(accounts)
      .where(accountInWorkspace(workspaceId, accountId));
    if (!current) {
      throw new AccountError('not-found', 'Conta não encontrada.');
    }
    // Cartão tem faturas; virar ou deixar de ser cartão quebraria o histórico.
    if ((current.type === 'credit_card') !== (data.type === 'credit_card')) {
      throw new AccountError('type-change', 'Uma conta não pode virar cartão de crédito, nem o contrário.');
    }
    const [account] = await tx
      .update(accounts)
      .set({ ...accountColumns(data), updatedBy: user.id })
      .where(accountInWorkspace(workspaceId, accountId))
      .returning({ id: accounts.id });
    if (!account) {
      throw new AccountError('not-found', 'Conta não encontrada.');
    }
    await saveCardDetails(tx, account.id, data);
    return account;
  });
}

/** Arquivar esconde a conta das listas; o histórico continua (docs/domain.md). */
export async function setAccountArchived(workspaceId: string, accountId: string, archived: boolean) {
  const { user } = await requireMembership(workspaceId, 'finance.write');
  const [account] = await getDb()
    .update(accounts)
    .set({ archivedAt: archived ? new Date() : null, updatedBy: user.id })
    .where(accountInWorkspace(workspaceId, accountId))
    .returning({ id: accounts.id });
  if (!account) {
    throw new AccountError('not-found', 'Conta não encontrada.');
  }
  return account;
}

function accountInWorkspace(workspaceId: string, accountId: string) {
  // Id malformado vira "não encontrada", não erro de sintaxe do Postgres.
  if (!z.uuid().safeParse(accountId).success) {
    throw new AccountError('not-found', 'Conta não encontrada.');
  }
  return and(eq(accounts.id, accountId), eq(accounts.workspaceId, workspaceId));
}
