import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { z } from "zod";
import { apiUser, atLeast } from "@/lib/auth/guards";
import {
  adminSetMessageStatus,
  adminCreateCoupon,
  adminSetUserRole,
  adminSetPostStatus,
} from "@/server/services/admin";
import { saveSettings, getSettings } from "@/server/services/settings";
import { ServiceError } from "@/server/services/users";

export async function GET(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");

  if (kind === "settings") {
    return jsonOk(await getSettings());
  }
  return jsonError("Unknown kind", 400);
}

const messageSchema = z.object({
  messageId: z.string().min(1),
  status: z.enum(["IN_PROGRESS", "RESOLVED"]),
});

const couponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  description: z.string().trim().max(320).optional(),
  percentOff: z.number().int().min(1).max(100).optional(),
  fixedOffMinor: z.number().int().min(1).optional(),
  redemptionLimit: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CUSTOMER", "GUIDE", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"]),
});

const postSchema = z.object({
  postId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const settingsSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  minBookingNoticeHours: z.number().int().min(0).max(720).optional(),
  defaultCancelWindowHours: z.number().int().min(0).max(720).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  contactEmail: z.string().trim().email().optional(),
});

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");

  try {
    if (kind === "message") {
      const parsed = await parseBody(request, messageSchema);
      if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
      const result = await adminSetMessageStatus({ ...parsed.data, actorId: user.id });
      return jsonOk(result);
    }

    if (kind === "coupon") {
      const parsed = await parseBody(request, couponSchema);
      if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
      const result = await adminCreateCoupon({
        code: parsed.data.code,
        description: parsed.data.description,
        percentOff: parsed.data.percentOff,
        fixedOffMinor: parsed.data.fixedOffMinor,
        redemptionLimit: parsed.data.redemptionLimit,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        actorId: user.id,
      });
      return jsonOk(result, 201);
    }

    if (kind === "role") {
      const parsed = await parseBody(request, roleSchema);
      if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
      const result = await adminSetUserRole({ ...parsed.data, actorId: user.id });
      return jsonOk(result);
    }

    if (kind === "post") {
      const parsed = await parseBody(request, postSchema);
      if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
      const result = await adminSetPostStatus({ ...parsed.data, actorId: user.id });
      return jsonOk(result);
    }

    if (kind === "settings") {
      if (!atLeast(user, "MANAGER")) return jsonError("Forbidden", 403);
      const parsed = await parseBody(request, settingsSchema);
      if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);
      await saveSettings(parsed.data);
      return jsonOk(await getSettings());
    }

    return jsonError("Unknown kind", 400);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[admin misc]", err);
    return jsonError("Update failed", 500);
  }
}
