import { CardError, listCardInvoices } from '@/server/dal/cards';
import { errorResponse } from '@/server/http/errors';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/cards/[cardId]/invoices'>,
) {
  const { workspaceId, cardId } = await ctx.params;
  try {
    return Response.json(await listCardInvoices(workspaceId, cardId), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof CardError) {
      return Response.json({ error: error.code }, { status: 404 });
    }
    return errorResponse(error);
  }
}
