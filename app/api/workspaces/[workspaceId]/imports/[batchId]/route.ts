import { ImportError, getImportBatch } from '@/server/dal/imports';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/imports/[batchId]'>,
) {
  const { workspaceId, batchId } = await ctx.params;
  try {
    return Response.json(await getImportBatch(workspaceId, batchId), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof ImportError) {
      return Response.json({ error: error.code }, { status: 404 });
    }
    return errorResponse(error);
  }
}
