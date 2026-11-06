import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { getCrmClient, updateCrmClient } from "@/server/services/crm";

type Ctx = RouteContext<"/api/admin/crm/clients/[id]">;

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  const client = await getCrmClient(id);
  if (!client) return jsonError("Not found", 404);
  return jsonOk(client);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body", 400);

  const input: {
    stage?: string;
    source?: string | null;
    ownerId?: string | null;
    tagIds?: string[];
  } = {};
  if (typeof body.stage === "string") input.stage = body.stage;
  if (body.source === null || typeof body.source === "string") input.source = body.source as string | null;
  if (body.ownerId === null || typeof body.ownerId === "string") input.ownerId = body.ownerId as string | null;
  if (Array.isArray(body.tagIds)) input.tagIds = body.tagIds.filter((t): t is string => typeof t === "string");

  try {
    const row = await updateCrmClient(id, input, { id: user.id });
    return jsonOk(row);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return jsonError(err instanceof Error ? err.message : "Update failed", status);
  }
}
