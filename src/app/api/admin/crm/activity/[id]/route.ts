import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { deleteCrmActivity } from "@/server/services/crm";

type Ctx = RouteContext<"/api/admin/crm/activity/[id]">;

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  await deleteCrmActivity(id, { id: user.id });
  return jsonOk({ id });
}
