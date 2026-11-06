import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { tripPlanSchema } from "@/lib/validation";
import { generateItinerary, saveTripPlan } from "@/server/services/planner";
import { apiUser } from "@/lib/auth/guards";
import { ServiceError } from "@/server/services/users";
import { rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`planner:${ip}`, 15, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, tripPlanSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  const url = new URL(request.url);
  const shouldSave = url.searchParams.get("save") === "1";

  try {
    const itinerary = await generateItinerary(parsed.data);

    if (!shouldSave) {
      return jsonOk(itinerary);
    }

    const user = await apiUser();
    if (!user) return jsonError("Unauthorized", 401);
    const customer = await import("@/lib/db/prisma").then((m) =>
      m.prisma.customer.findUnique({ where: { userId: user.id }, select: { id: true } })
    );
    if (!customer) return jsonError("Customer profile missing", 400);

    const plan = await saveTripPlan({
      customerId: customer.id,
      planner: parsed.data,
      itinerary: itinerary.days,
      totalMinor: itinerary.totalMinor,
      currency: itinerary.currency,
    });
    return jsonOk({ ...itinerary, shareSlug: plan.shareSlug, id: plan.id }, 201);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[planner]", err);
    return jsonError("Planning failed", 500);
  }
}
