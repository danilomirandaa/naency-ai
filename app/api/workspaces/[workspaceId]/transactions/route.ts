import { filtersFromSearchParams } from '@/features/transactions/filters';
import { listTransactions } from '@/server/dal/transactions';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/transactions'>,
) {
  const { workspaceId } = await ctx.params;
  const filters = filtersFromSearchParams(request.nextUrl.searchParams);
  try {
    return Response.json(await listTransactions(workspaceId, filters), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
