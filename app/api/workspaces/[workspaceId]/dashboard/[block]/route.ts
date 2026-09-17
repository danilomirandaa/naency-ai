import { DASHBOARD_BLOCKS, type DashboardBlock } from '@/features/dashboard/api/dashboard.queries';
import { currentMonth, isMonth } from '@/lib/dates';
import { loadDashboardBlock } from '@/server/dal/dashboard-blocks';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/dashboard/[block]'>,
) {
  const { workspaceId, block } = await ctx.params;
  if (!(DASHBOARD_BLOCKS as string[]).includes(block)) {
    return Response.json({ error: 'not-found' }, { status: 404 });
  }
  const month = request.nextUrl.searchParams.get('mes');
  try {
    const data = await loadDashboardBlock(workspaceId, block as DashboardBlock, isMonth(month) ? month : currentMonth());
    return Response.json(data, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
