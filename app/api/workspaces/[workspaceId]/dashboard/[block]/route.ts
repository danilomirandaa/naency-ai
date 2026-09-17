import { DASHBOARD_BLOCKS, type DashboardBlock } from '@/features/dashboard/api/dashboard.queries';
import { currentMonth, isMonth, monthRange } from '@/lib/dates';
import { isValidRange } from '@/lib/periods';
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
  const params = request.nextUrl.searchParams;
  const custom = { from: params.get('de'), to: params.get('ate') };
  const month = params.get('mes');
  const range = isValidRange(custom) ? custom : monthRange(isMonth(month) ? month : currentMonth());
  try {
    const data = await loadDashboardBlock(workspaceId, block as DashboardBlock, range);
    return Response.json(data, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
