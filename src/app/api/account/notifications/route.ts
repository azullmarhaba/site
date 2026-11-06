import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { apiUser } from "@/lib/auth/guards";
import { markNotificationsRead } from "@/server/services/notifications";
import { z } from "zod";

const markSchema = z.object({ id: z.string().cuid().optional() });

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = await parseBody(request, markSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    await markNotificationsRead(user.id, parsed.data.id);
    return jsonOk({ updated: true });
  } catch (err) {
    console.error("[notifications]", err);
    return jsonError("Update failed", 500);
  }
}
