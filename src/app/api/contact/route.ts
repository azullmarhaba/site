import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { contactSchema } from "@/lib/validation";
import { submitContactMessage } from "@/server/services/contact";
import { rateLimit } from "@/lib/security";
import { getLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, contactSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  const locale = await getLocale();
  const created = await submitContactMessage({
    ...parsed.data,
    phone: parsed.data.phone || undefined,
    subject: parsed.data.subject || undefined,
    locale: parsed.data.locale ?? locale,
  });
  return jsonOk({ id: created.id }, 201);
}
