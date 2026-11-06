import { jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { adminSetExperienceStatus, adminUpdateExperience } from "@/server/services/admin";
import { ServiceError } from "@/server/services/users";

const statusSchema = z.object({
  experienceId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

const updateSchema = z.object({
  experienceId: z.string().min(1),
  title: z.string().trim().min(3).max(200).optional(),
  summary: z.string().trim().max(400).optional(),
  description: z.string().trim().min(10).optional(),
  priceMinor: z.number().int().min(0).optional(),
  capacityMin: z.number().int().min(1).optional(),
  capacityMax: z.number().int().min(1).optional(),
  featured: z.boolean().optional(),
  meetingPoint: z.string().trim().max(255).optional(),
  cancelWindowHours: z.number().int().min(0).optional(),
  coverImageId: z.string().min(1).nullable().optional(),
  galleryMediaIds: z.array(z.string().min(1)).max(30).optional(),
});

async function guard() {
  const user = await apiUser();
  if (!user) return null;
  if (!atLeast(user, "STAFF")) return null;
  return user;
}

export async function PATCH(request: Request) {
  const user = await guard();
  if (!user) return jsonError("Unauthorized or forbidden", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  // Status-only payloads: { experienceId, status }
  if (body && typeof body === "object" && "status" in body) {
    const statusParsed = statusSchema.safeParse(body);
    if (!statusParsed.success)
      return jsonError("Validation failed", 400, statusParsed.error.flatten());
    try {
      const updated = await adminSetExperienceStatus({
        experienceId: statusParsed.data.experienceId,
        status: statusParsed.data.status,
        actorId: user.id,
      });
      return jsonOk(updated);
    } catch (err) {
      if (err instanceof ServiceError) return jsonError(err.message, err.status);
      return jsonError("Update failed", 500);
    }
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", 400, parsed.error.flatten());

  try {
    const updated = await adminUpdateExperience({
      experienceId: parsed.data.experienceId,
      actorId: user.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      description: parsed.data.description,
      priceMinor: parsed.data.priceMinor,
      capacityMin: parsed.data.capacityMin,
      capacityMax: parsed.data.capacityMax,
      featured: parsed.data.featured,
      meetingPoint: parsed.data.meetingPoint,
      cancelWindowHours: parsed.data.cancelWindowHours,
      coverImageId: parsed.data.coverImageId,
      galleryMediaIds: parsed.data.galleryMediaIds,
    });
    return jsonOk(updated);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    return jsonError("Update failed", 500);
  }
}
