import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { customTourSchema } from "@/lib/validation";
import { submitCustomTourRequest } from "@/server/services/customTour";
import { rateLimit } from "@/lib/security";
import { getLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`custom-tour:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, customTourSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  const locale = await getLocale();
  const created = await submitCustomTourRequest({
    ...parsed.data,
    phone: parsed.data.phone || undefined,
    destinations: parsed.data.destinations || undefined,
    message: parsed.data.message || undefined,
    locale: parsed.data.locale ?? locale,
  });
  return jsonOk({ id: created.id }, 201);
}
