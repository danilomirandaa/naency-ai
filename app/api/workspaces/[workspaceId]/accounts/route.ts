import { listAccounts } from '@/server/dal/accounts';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/accounts'>,
) {
  const { workspaceId } = await ctx.params;
  const includeArchived = request.nextUrl.searchParams.get('arquivadas') === '1';
  try {
    return Response.json(await listAccounts(workspaceId, { includeArchived }), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
