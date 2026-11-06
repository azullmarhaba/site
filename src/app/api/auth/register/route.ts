import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { registerUser, ServiceError } from "@/server/services/users";
import { rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, registerSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const user = await registerUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      phone: parsed.data.phone || undefined,
    });
    return jsonOk({ id: user.id, email: user.email, name: user.name }, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return jsonError(err.message, err.status);
    }
    console.error("[register]", err);
    return jsonError("Registration failed", 500);
  }
}
