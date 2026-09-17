import { currentMonth, isMonth } from '@/lib/dates';
import { listBudgets } from '@/server/dal/planning';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, ctx: RouteContext<'/api/workspaces/[workspaceId]/budgets'>) {
  const { workspaceId } = await ctx.params;
  const month = request.nextUrl.searchParams.get('mes');
  try {
    return Response.json(await listBudgets(workspaceId, isMonth(month) ? month : currentMonth()), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
