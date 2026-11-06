import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { reviewSchema } from "@/lib/validation";
import { submitReview, ServiceError } from "@/server/services/reviews";
import { apiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`review:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, reviewSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const review = await submitReview({
      userId: user.id,
      ...parsed.data,
      title: parsed.data.title || undefined,
    });
    return jsonOk({ id: review.id, status: review.status }, 201);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[review]", err);
    return jsonError("Review failed", 500);
  }
}
