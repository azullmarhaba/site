import { z } from "zod";
import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { ServiceError, updateCrmLead } from "@/server/services/crm";

const updateSchema = z.object({
  stage: z.enum(["LEAD", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  ownerId: z.string().min(1).nullable().optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/crm/leads/[id]">
) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  const parsed = await parseBody(request, updateSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
  try {
    return jsonOk(await updateCrmLead(id, parsed.data, { id: user.id }));
  } catch (error) {
    if (error instanceof ServiceError) return jsonError(error.message, error.status);
    console.error("[admin CRM lead update]", error);
    return jsonError("Lead update failed", 500);
  }
}
