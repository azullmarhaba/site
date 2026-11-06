import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { createCrmTask, listCrmTasks } from "@/server/services/crm";

export async function GET(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const params = new URL(request.url).searchParams;
  const tasks = await listCrmTasks({
    status: params.get("status") ?? undefined,
    assigneeId: params.get("assigneeId") ?? undefined,
  });
  return jsonOk({ tasks });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let customerId = "";
  let title = "";
  let dueAt: string | null = null;
  let assigneeId: string | null = null;
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (typeof raw.customerId === "string") customerId = raw.customerId;
    if (typeof raw.title === "string") title = raw.title;
    if (typeof raw.dueAt === "string") dueAt = raw.dueAt;
    if (typeof raw.assigneeId === "string") assigneeId = raw.assigneeId;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!customerId || !title.trim()) return jsonError("customerId and title are required", 400);

  try {
    const task = await createCrmTask({ customerId, title, dueAt, assigneeId }, { id: user.id });
    return jsonOk(task, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    return jsonError(err instanceof Error ? err.message : "Failed", status);
  }
}
