import { jsonError, jsonOk } from "@/lib/api";
import { getTripPlanBySlug } from "@/server/services/planner";
import { ServiceError } from "@/server/services/users";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/trip-plans/[slug]">
) {
  const { slug } = await ctx.params;
  try {
    const plan = await getTripPlanBySlug(slug);
    return jsonOk({
      title: plan.title,
      days: plan.days,
      style: plan.style,
      interests: plan.interests,
      budget: plan.budget,
      itinerary: plan.itinerary,
      totalMinor: plan.totalMinor,
      currency: plan.currency,
      author: plan.customer.fullName,
      createdAt: plan.createdAt,
    });
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    return jsonError("Not found", 404);
  }
}
