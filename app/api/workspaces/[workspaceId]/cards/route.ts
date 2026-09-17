import { listCards } from '@/server/dal/cards';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/workspaces/[workspaceId]/cards'>) {
  const { workspaceId } = await ctx.params;
  try {
    return Response.json(await listCards(workspaceId), { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
