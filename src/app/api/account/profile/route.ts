import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { updateProfile, ServiceError } from "@/server/services/users";
import { apiUser } from "@/lib/auth/guards";

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = await parseBody(request, profileSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    await updateProfile(user.id, parsed.data);
    return jsonOk({ updated: true });
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    return jsonError("Update failed", 500);
  }
}
