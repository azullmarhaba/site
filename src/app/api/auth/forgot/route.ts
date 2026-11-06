import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { forgotSchema } from "@/lib/validation";
import { requestPasswordReset } from "@/server/services/users";
import { rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`forgot:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, forgotSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  await requestPasswordReset(parsed.data.email);
  // Always the same response — never reveal whether the account exists.
  return jsonOk({ sent: true });
}
