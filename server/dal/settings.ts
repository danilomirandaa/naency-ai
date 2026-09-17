import 'server-only';
import type { AiUsageSummary } from '@/features/settings/types';
import { monthRange } from '@/lib/dates';
import { requireMembership } from '@/server/auth/membership';
import { getDb } from '@/server/db/client';
import { aiUsageEvents } from '@/server/db/schema';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';

/** Consumo da AI no mês, por tarefa e modelo. */
export async function getAiUsageSummary(workspaceId: string, month: string): Promise<AiUsageSummary> {
  await requireMembership(workspaceId, 'workspace.read');
  const { from, to } = monthRange(month);
  const rows = await getDb()
    .select({
      task: aiUsageEvents.task,
      model: aiUsageEvents.model,
      calls: count(),
      inputTokens: sql<string>`sum(${aiUsageEvents.inputTokens})`,
      outputTokens: sql<string>`sum(${aiUsageEvents.outputTokens})`,
    })
    .from(aiUsageEvents)
    .where(
      and(
        eq(aiUsageEvents.workspaceId, workspaceId),
        gte(aiUsageEvents.createdAt, new Date(`${from}T00:00:00-03:00`)),
        lt(aiUsageEvents.createdAt, new Date(new Date(`${to}T00:00:00-03:00`).getTime() + 86_400_000)),
      ),
    )
    .groupBy(aiUsageEvents.task, aiUsageEvents.model);
  return {
    month,
    items: rows.map((row) => ({
      task: row.task,
      model: row.model,
      calls: row.calls,
      inputTokens: Number(row.inputTokens),
      outputTokens: Number(row.outputTokens),
    })),
  };
}
