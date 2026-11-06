import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { addCrmActivity } from "@/server/services/crm";

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let customerId = "";
  let type = "NOTE";
  let body = "";
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (typeof raw.customerId === "string") customerId = raw.customerId;
    if (typeof raw.type === "string") type = raw.type;
    if (typeof raw.body === "string") body = raw.body;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!customerId) return jsonError("customerId is required", 400);

  try {
    const activity = await addCrmActivity({ customerId, type, body }, { id: user.id });
    return jsonOk(activity, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return jsonError(err instanceof Error ? err.message : "Failed", status);
  }
}
