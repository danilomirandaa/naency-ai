import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount } from './accounts';
import { createImportBatch, finishImportJob, startImportJob } from './imports';
import { acceptInvitation, createInvitation } from './members';
import { listNotifications } from './notifications';
import { createTransaction } from './transactions';
import { createWorkspace } from './workspaces';

let workspaceId: string;
let nubank: string;
const TODAY = '2026-09-18';
const ofx =
  '<OFX><STMTTRN><DTPOSTED>20260902<TRNAMT>-45.90<MEMO>Padaria<FITID>1</STMTTRN></OFX>';

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2026-01-01',
  }));
});

describe('notificações', () => {
  it('sem nada acontecendo, a lista vem vazia', async () => {
    await expect(listNotifications(workspaceId, { today: TODAY })).resolves.toEqual([]);
  });

  it('importação concluída e importação com erro viram avisos', async () => {
    const { id } = await createImportBatch(workspaceId, { accountId: nubank, fileName: 'extrato.ofx', text: ofx });
    await startImportJob(workspaceId, id, 'suggest');
    await finishImportJob(workspaceId, id, 'A AI não respondeu agora.');

    const [aviso] = await listNotifications(workspaceId, { today: TODAY });
    expect(aviso).toMatchObject({
      kind: 'import-error',
      title: 'A importação não terminou',
      description: 'extrato.ofx: A AI não respondeu agora.',
      href: `/importar?lote=${id}`,
    });

    await startImportJob(workspaceId, id, 'suggest');
    await finishImportJob(workspaceId, id);
    expect((await listNotifications(workspaceId, { today: TODAY }))[0]).toMatchObject({
      kind: 'import',
      title: 'Sugestões prontas',
    });
  });

  it('conta atrasada vira um aviso com a mais antiga', async () => {
    const planned = (date: string) =>
      createTransaction(workspaceId, {
        kind: 'expense',
        accountId: nubank,
        amountCents: 10_000,
        date,
        description: 'Conta de luz',
        categoryId: null,
        status: 'planned',
        notes: null,
      });
    await planned('2026-09-05');
    await planned('2026-09-10');
    // Ainda não venceu: fica de fora.
    await planned('2026-09-30');

    const avisos = await listNotifications(workspaceId, { today: TODAY });
    expect(avisos).toEqual([
      expect.objectContaining({
        kind: 'overdue',
        title: '2 contas atrasadas',
        description: 'A mais antiga venceu em 05/09/2026.',
        href: '/transacoes?situacao=atrasadas',
      }),
    ]);
  });

  it('fatura fechada e não paga avisa o vencimento; aberta não', async () => {
    const { id: card } = await createAccount(workspaceId, {
      name: 'XP Black',
      type: 'credit_card',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: '2026-01-01',
      closingDay: 10,
      dueDay: 20,
    });
    // Compra de agosto: fatura fecha 10/08 e vence 20/08 (já fechada em 18/09).
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: card,
      amountCents: 20_000,
      date: '2026-08-05',
      description: 'Compra',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });
    // Compra de setembro depois do fechamento: fatura ainda aberta.
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: card,
      amountCents: 5_000,
      date: '2026-09-15',
      description: 'Compra nova',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });

    const avisos = await listNotifications(workspaceId, { today: TODAY });
    expect(avisos.filter((item) => item.kind === 'invoice')).toEqual([
      expect.objectContaining({
        title: 'Fatura de agosto de 2026 fechada',
        description: 'XP Black: vence em 20/08/2026.',
        href: `/cartoes/${card}?fatura=2026-08`,
      }),
    ]);
  });

  it('quem não é membro não vê os avisos', async () => {
    const { token } = await createInvitation(workspaceId, { email: 'leitor@exemplo.com', role: 'viewer' });
    await createUser('estranho@exemplo.com', { signIn: true });
    await expect(listNotifications(workspaceId)).rejects.toBeInstanceOf(ForbiddenError);

    await createUser('leitor@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(listNotifications(workspaceId, { today: TODAY })).resolves.toEqual([]);
  });
});
