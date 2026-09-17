import { ForbiddenError } from '@/server/auth/errors';
import { aiUsageEvents, workspaces } from '@/server/db/schema';
import { createUser, getTestDb, resetTestDb } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { acceptInvitation, createInvitation } from './members';
import { getAiUsageSummary } from './settings';
import { createWorkspace, renameWorkspace } from './workspaces';

let workspaceId: string;

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Casa' }));
});

describe('configurações', () => {
  it('admin renomeia; editor não', async () => {
    await renameWorkspace(workspaceId, { name: '  Família Miranda ' });
    const [row] = await getTestDb().select({ name: workspaces.name }).from(workspaces);
    expect(row?.name).toBe('Família Miranda');

    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'editor' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(renameWorkspace(workspaceId, { name: 'Outro' })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(renameWorkspace(workspaceId, { name: 'x' })).rejects.toThrow();
  });

  it('consumo de AI do mês por tarefa e modelo', async () => {
    const db = getTestDb();
    await db.insert(aiUsageEvents).values([
      { workspaceId, task: 'enrich', model: 'claude-opus-5', inputTokens: 1000, outputTokens: 200, createdAt: new Date('2026-09-10T12:00:00Z') },
      { workspaceId, task: 'enrich', model: 'claude-opus-5', inputTokens: 500, outputTokens: 100, createdAt: new Date('2026-09-30T23:30:00-03:00') },
      { workspaceId, task: 'enrich', model: 'claude-opus-5', inputTokens: 9, outputTokens: 9, createdAt: new Date('2026-10-01T00:30:00-03:00') },
    ]);
    await expect(getAiUsageSummary(workspaceId, '2026-09')).resolves.toEqual({
      month: '2026-09',
      items: [{ task: 'enrich', model: 'claude-opus-5', calls: 2, inputTokens: 1500, outputTokens: 300 }],
    });
  });
});
