import { z } from "zod";
import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import {
  createCrmLead,
  listCrmLeads,
  ServiceError,
} from "@/server/services/crm";

const createSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(120).optional(),
  ownerId: z.string().min(1).nullable().optional(),
});

export async function GET(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);
  const params = new URL(request.url).searchParams;
  const leads = await listCrmLeads({
    q: params.get("q") ?? undefined,
    stage: params.get("stage") ?? undefined,
    ownerId: params.get("ownerId") ?? undefined,
  });
  return jsonOk({ leads });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const parsed = await parseBody(request, createSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
  try {
    const lead = await createCrmLead(parsed.data, { id: user.id });
    return jsonOk(lead, 201);
  } catch (error) {
    if (error instanceof ServiceError) return jsonError(error.message, error.status);
    console.error("[admin CRM lead create]", error);
    return jsonError("Lead creation failed", 500);
  }
}
