import { listCategories } from '@/server/dal/categories';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/categories'>,
) {
  const { workspaceId } = await ctx.params;
  const includeArchived = request.nextUrl.searchParams.get('arquivadas') === '1';
  try {
    return Response.json(await listCategories(workspaceId, { includeArchived }), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
