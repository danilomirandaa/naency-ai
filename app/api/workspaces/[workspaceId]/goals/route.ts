import { listGoals } from '@/server/dal/planning';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/workspaces/[workspaceId]/goals'>) {
  const { workspaceId } = await ctx.params;
  try {
    return Response.json(await listGoals(workspaceId), { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
