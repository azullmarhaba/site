import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { cancelBookingSchema } from "@/lib/validation";
import { cancelBooking } from "@/server/services/booking";
import { ServiceError } from "@/server/services/users";
import { apiUser } from "@/lib/auth/guards";

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = await parseBody(request, cancelBookingSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const result = await cancelBooking(parsed.data.reference, user.id);
    return jsonOk(result);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[cancel]", err);
    return jsonError("Cancellation failed", 500);
  }
}
