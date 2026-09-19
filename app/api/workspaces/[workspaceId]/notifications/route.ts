import { errorResponse } from '@/server/http/errors';
import { listNotifications } from '@/server/dal/notifications';

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/workspaces/[workspaceId]/notifications'>,
) {
  const { workspaceId } = await ctx.params;
  try {
    return Response.json(await listNotifications(workspaceId), {
      headers: { 'cache-control': 'private, no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
