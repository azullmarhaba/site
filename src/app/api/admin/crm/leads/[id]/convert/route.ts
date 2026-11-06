import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { convertCrmLead, ServiceError } from "@/server/services/crm";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/crm/leads/[id]/convert">
) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  try {
    return jsonOk(await convertCrmLead(id, { id: user.id }));
  } catch (error) {
    if (error instanceof ServiceError) return jsonError(error.message, error.status);
    console.error("[admin CRM lead conversion]", error);
    return jsonError("Lead conversion failed", 500);
  }
}
