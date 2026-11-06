import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { resetSchema } from "@/lib/validation";
import { resetPassword, ServiceError } from "@/server/services/users";
import { rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`reset:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, resetSchema);
  if ("error" in parsed) {
    if (parsed.error === "Validation failed") {
      const flatten = parsed.details as { fieldErrors?: Record<string, string[]> } | undefined;
      if (flatten?.fieldErrors?.confirmPassword?.includes("MISMATCH")) {
        return jsonError("MISMATCH", 400);
      }
    }
    return jsonError(parsed.error, 400, parsed.details);
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return jsonOk({ reset: true });
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    return jsonError("Reset failed", 500);
  }
}
