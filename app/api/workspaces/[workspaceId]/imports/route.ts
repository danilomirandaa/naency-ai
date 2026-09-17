import { listImportBatches } from '@/server/dal/imports';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/workspaces/[workspaceId]/imports'>) {
  const { workspaceId } = await ctx.params;
  try {
    return Response.json(await listImportBatches(workspaceId), { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
