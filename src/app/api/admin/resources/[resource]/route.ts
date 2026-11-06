import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import {
  getResource,
  prismaCode,
  ValidationError,
} from "@/server/services/admin-crud";

type Ctx = RouteContext<"/api/admin/resources/[resource]">;

function toActor(user: NonNullable<Awaited<ReturnType<typeof apiUser>>>) {
  return { id: user.id, roles: user.roles };
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function fail(err: unknown) {
  if (err instanceof ValidationError) {
    return jsonError(err.message, 400, err.details);
  }
  const code = prismaCode(err);
  if (code === "P2002") return jsonError("A record with this unique value already exists.", 409);
  if (code === "P2003") return jsonError("A related record was not found.", 400);
  if (code === "P2025") return jsonError("Record not found.", 404);
  console.error("[admin resource]", err);
  return jsonError("Operation failed", 500);
}

export async function GET(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { resource } = await ctx.params;
  const handler = getResource(resource);
  if (!handler) return jsonError("Unknown resource", 404);
  if (!atLeast(user, handler.minRole)) return jsonError("Forbidden", 403);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);

  try {
    const row = await handler.get(id);
    if (!row) return jsonError("Not found", 404);
    return jsonOk(row);
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { resource } = await ctx.params;
  const handler = getResource(resource);
  if (!handler) return jsonError("Unknown resource", 404);
  if (!atLeast(user, handler.minRole)) return jsonError("Forbidden", 403);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body", 400);

  try {
    const row = await handler.create(body, toActor(user));
    return jsonOk(row, 201);
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { resource } = await ctx.params;
  const handler = getResource(resource);
  if (!handler) return jsonError("Unknown resource", 404);
  if (!atLeast(user, handler.minRole)) return jsonError("Forbidden", 403);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body", 400);
  const id = body.id;
  if (typeof id !== "string" || !id) return jsonError("Missing id", 400);
  const fields = Object.fromEntries(Object.entries(body).filter(([k]) => k !== "id"));

  try {
    const row = await handler.update(id, fields, toActor(user));
    return jsonOk(row);
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { resource } = await ctx.params;
  const handler = getResource(resource);
  if (!handler) return jsonError("Unknown resource", 404);
  if (!atLeast(user, handler.minRole)) return jsonError("Forbidden", 403);

  let id = new URL(request.url).searchParams.get("id");
  if (!id) {
    const body = await readJson(request);
    if (body && typeof body.id === "string") id = body.id;
  }
  if (!id) return jsonError("Missing id", 400);

  try {
    await handler.remove(id, toActor(user));
    return jsonOk({ id });
  } catch (err) {
    return fail(err);
  }
}
