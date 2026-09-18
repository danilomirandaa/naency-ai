import { ForbiddenError, UnauthenticatedError } from '@/server/auth/errors';
import { institutions } from '@/server/db/schema';
import { createUser, getTestDb, resetTestDb, signInAs } from '@/tests/integration/db';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AccountError,
  createAccount,
  listAccounts,
  listInstitutions,
  setAccountArchived,
  updateAccount,
} from './accounts';
import { acceptInvitation, createInvitation } from './members';
import { createTransaction } from './transactions';
import { createWorkspace } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;

const input = {
  name: 'Nubank',
  type: 'checking' as const,
  institutionId: null,
  initialBalanceCents: 150_075,
  initialBalanceDate: '2026-09-01',
};

beforeEach(async () => {
  await resetTestDb();
  admin = await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
});

async function joinAs(email: string, role: 'editor' | 'viewer') {
  signInAs(admin);
  const { token } = await createInvitation(workspaceId, { email, role });
  const user = await createUser(email, { signIn: true });
  await acceptInvitation(token);
  return user;
}

async function institutionId(slug: string) {
  const [row] = await getTestDb()
    .select({ id: institutions.id })
    .from(institutions)
    .where(eq(institutions.slug, slug));
  if (!row) {
    throw new Error(`Instituição ${slug} não semeada`);
  }
  return row.id;
}

describe('catálogo de instituições', () => {
  it('vem semeado pela migration, em ordem alfabética', async () => {
    const list = await listInstitutions(workspaceId);
    expect(list.map((item) => item.name)).toEqual([
      'Banco do Brasil',
      'Bradesco',
      'C6 Bank',
      'Caixa',
      'Dinheiro/Carteira',
      'Inter',
      'Itaú',
      'Nubank',
      'Santander',
      'XP Investimentos',
    ]);
  });

  it('não mostra instituição cadastrada por outro espaço', async () => {
    const { id: otherWorkspace } = await createWorkspace({ name: 'Empresa' });
    await getTestDb()
      .insert(institutions)
      .values({ workspaceId: otherWorkspace, name: 'Cooperativa X', kind: 'bank', color: '#123456' });

    expect((await listInstitutions(otherWorkspace)).map((item) => item.name)).toContain(
      'Cooperativa X',
    );
    expect((await listInstitutions(workspaceId)).map((item) => item.name)).not.toContain(
      'Cooperativa X',
    );
  });
});

describe('contas: CRUD', () => {
  it('cria com instituição e lista com saldo', async () => {
    const nubank = await institutionId('nubank');
    const { id } = await createAccount(workspaceId, { ...input, institutionId: nubank });

    await expect(listAccounts(workspaceId)).resolves.toEqual([
      {
        id,
        name: 'Nubank',
        type: 'checking',
        institution: { id: nubank, name: 'Nubank', color: '#820AD1' },
        initialBalanceCents: 150_075,
        initialBalanceDate: '2026-09-01',
        balanceCents: 150_075,
        archived: false,
        card: null,
      },
    ]);
  });

  it('o saldo informado é o do fim do dia: o que é do mesmo dia não soma de novo', async () => {
    const { id } = await createAccount(workspaceId, { ...input, initialBalanceCents: 201_595, initialBalanceDate: '2026-09-18' });
    const lancamento = (date: string, amountCents: number) =>
      createTransaction(workspaceId, {
        kind: 'expense',
        accountId: id,
        amountCents,
        date,
        description: 'Compra',
        categoryId: null,
        status: 'cleared',
        notes: null,
      });
    // Extrato do próprio dia: esses valores já estão no saldo que o banco mostrou.
    await lancamento('2026-09-18', 10_000);
    await lancamento('2026-09-17', 5_000);
    expect((await listAccounts(workspaceId))[0]?.balanceCents).toBe(201_595);

    // Só o que vem depois muda o saldo.
    await lancamento('2026-09-19', 1_000);
    expect((await listAccounts(workspaceId))[0]?.balanceCents).toBe(200_595);
  });

  it('edita todos os campos', async () => {
    const { id } = await createAccount(workspaceId, input);
    const inter = await institutionId('inter');
    await updateAccount(workspaceId, id, {
      name: 'Inter reserva',
      type: 'savings',
      institutionId: inter,
      initialBalanceCents: -2_000,
      initialBalanceDate: '2026-08-15',
    });

    await expect(listAccounts(workspaceId)).resolves.toEqual([
      expect.objectContaining({
        name: 'Inter reserva',
        type: 'savings',
        institution: expect.objectContaining({ name: 'Inter' }),
        initialBalanceCents: -2_000,
        initialBalanceDate: '2026-08-15',
      }),
    ]);
  });

  it('arquivada some da lista padrão e volta ao desarquivar', async () => {
    const { id } = await createAccount(workspaceId, input);
    await setAccountArchived(workspaceId, id, true);

    await expect(listAccounts(workspaceId)).resolves.toEqual([]);
    await expect(listAccounts(workspaceId, { includeArchived: true })).resolves.toEqual([
      expect.objectContaining({ id, archived: true }),
    ]);

    await setAccountArchived(workspaceId, id, false);
    await expect(listAccounts(workspaceId)).resolves.toEqual([
      expect.objectContaining({ id, archived: false }),
    ]);
  });

  it('valida a entrada no DAL, não só no formulário', async () => {
    await expect(createAccount(workspaceId, { ...input, name: ' ' })).rejects.toThrow();
    await expect(
      createAccount(workspaceId, { ...input, type: 'credit_card' as 'checking' }),
    ).rejects.toThrow();
    await expect(listAccounts(workspaceId)).resolves.toEqual([]);
  });
});

describe('contas: isolamento entre espaços', () => {
  it('não usa instituição cadastrada por outro espaço', async () => {
    const { id: otherWorkspace } = await createWorkspace({ name: 'Empresa' });
    const [foreign] = await getTestDb()
      .insert(institutions)
      .values({ workspaceId: otherWorkspace, name: 'Cooperativa X', kind: 'bank', color: '#123456' })
      .returning({ id: institutions.id });

    await expect(
      createAccount(workspaceId, { ...input, institutionId: foreign?.id ?? null }),
    ).rejects.toMatchObject({ code: 'invalid-institution' });
  });

  it('não edita nem arquiva conta de outro espaço, mesmo sendo admin dos dois', async () => {
    const { id: otherWorkspace } = await createWorkspace({ name: 'Empresa' });
    const { id } = await createAccount(otherWorkspace, input);

    await expect(updateAccount(workspaceId, id, input)).rejects.toBeInstanceOf(AccountError);
    await expect(setAccountArchived(workspaceId, id, true)).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(listAccounts(otherWorkspace)).resolves.toEqual([
      expect.objectContaining({ id, archived: false, name: 'Nubank' }),
    ]);
  });

  it('id malformado é "não encontrada"', async () => {
    await expect(setAccountArchived(workspaceId, 'x', true)).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('quem não é membro não lê nem escreve', async () => {
    await createAccount(workspaceId, input);
    signInAs(await createUser('intruso@exemplo.com'));

    await expect(listAccounts(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listInstitutions(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createAccount(workspaceId, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('sem sessão, nada', async () => {
    signInAs(null);
    await expect(listAccounts(workspaceId)).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('contas: papéis', () => {
  it('editor cria, edita e arquiva', async () => {
    await joinAs('esposa@exemplo.com', 'editor');
    const { id } = await createAccount(workspaceId, input);
    await updateAccount(workspaceId, id, { ...input, name: 'Casa' });
    await setAccountArchived(workspaceId, id, true);

    await expect(listAccounts(workspaceId, { includeArchived: true })).resolves.toEqual([
      expect.objectContaining({ name: 'Casa', archived: true }),
    ]);
  });

  it('leitor vê as contas, mas não cria, edita nem arquiva', async () => {
    const { id } = await createAccount(workspaceId, input);
    await joinAs('esposa@exemplo.com', 'viewer');

    await expect(listAccounts(workspaceId)).resolves.toHaveLength(1);
    await expect(createAccount(workspaceId, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateAccount(workspaceId, id, { ...input, name: 'X' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setAccountArchived(workspaceId, id, true)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAccounts(workspaceId)).resolves.toEqual([
      expect.objectContaining({ name: 'Nubank', archived: false }),
    ]);
  });
});
