import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { deleteCrmTask, updateCrmTask } from "@/server/services/crm";

type Ctx = RouteContext<"/api/admin/crm/tasks/[id]">;

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const input: { title?: string; status?: string; dueAt?: string | null; assigneeId?: string | null } = {};
  if (typeof body.title === "string") input.title = body.title;
  if (typeof body.status === "string") input.status = body.status;
  if (body.dueAt === null || typeof body.dueAt === "string") input.dueAt = body.dueAt as string | null;
  if (body.assigneeId === null || typeof body.assigneeId === "string")
    input.assigneeId = body.assigneeId as string | null;

  try {
    const task = await updateCrmTask(id, input, { id: user.id });
    return jsonOk(task);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return jsonError(err instanceof Error ? err.message : "Update failed", status);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  await deleteCrmTask(id, { id: user.id });
  return jsonOk({ id });
}
