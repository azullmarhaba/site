import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { clientIp } from "@/lib/security";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: unknown;
};

/** Append an audit-log row. Never throws — auditing must not break mutations. */
export async function logAudit(input: AuditInput) {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        diff: input.diff !== undefined ? (input.diff as object) : undefined,
        ipAddress: clientIp(h),
        userAgent: h.get("user-agent")?.slice(0, 512) ?? null,
      },
    });
  } catch {
    // best-effort
  }
}
