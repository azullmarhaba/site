import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { ensureTag, listCrmTags } from "@/server/services/crm";

export async function GET() {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  return jsonOk({ tags: await listCrmTags() });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  let name = "";
  try {
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name === "string") name = body.name;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!name.trim()) return jsonError("Tag name is required", 400);
  const id = await ensureTag(name);
  return jsonOk({ id, name: name.trim().slice(0, 60) }, 201);
}
