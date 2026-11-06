import { jsonError, jsonOk } from "@/lib/api";
import { getDayAvailability } from "@/server/services/catalog";
import { prisma } from "@/lib/db/prisma";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/availability/[slug]">
) {
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";

  if (!DATE_PATTERN.test(date)) {
    return jsonError("Invalid or missing ?date=YYYY-MM-DD", 400);
  }

  const experience = await prisma.experience.findUnique({
    where: { slug },
    select: { id: true, capacityMax: true },
  });
  if (!experience) return jsonError("Not found", 404);

  const day = await getDayAvailability(experience.id, date);
  if (!day) return jsonError("No availability data for this date", 404);
  return jsonOk({ ...day, capacityMax: experience.capacityMax });
}
