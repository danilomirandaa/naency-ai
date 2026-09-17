import { listRecurringRules } from '@/server/dal/recurring';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/workspaces/[workspaceId]/recurring'>) {
  const { workspaceId } = await ctx.params;
  try {
    return Response.json(await listRecurringRules(workspaceId), { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
