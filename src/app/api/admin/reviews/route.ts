import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { z } from "zod";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { moderateReview } from "@/server/services/reviews";
import { ServiceError } from "@/server/services/users";

const schema = z.object({
  reviewId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const parsed = await parseBody(request, schema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const review = await moderateReview({
      reviewId: parsed.data.reviewId,
      status: parsed.data.status,
      moderatorId: user.id,
    });
    return jsonOk({ id: review.id, status: review.status });
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    return jsonError("Moderation failed", 500);
  }
}
