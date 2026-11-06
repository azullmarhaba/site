import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ServiceError } from "./users";
import { logAudit } from "./audit";

export { ServiceError };

// ------------------------------------------------------------
// CRM — client pipeline, activity timeline, follow-up tasks and
// tags. Available to STAFF and above (super admins included).
// ------------------------------------------------------------

export const LEAD_STAGES = [
  "LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
] as const;
export type LeadStageValue = (typeof LEAD_STAGES)[number];

export const ACTIVITY_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING", "STAGE"] as const;
export type CrmActivityValue = (typeof ACTIVITY_TYPES)[number];

const ACTIVE_STAGES: LeadStageValue[] = ["LEAD", "CONTACTED", "QUALIFIED", "PROPOSAL"];

export function isLeadStage(value: string): value is LeadStageValue {
  return (LEAD_STAGES as readonly string[]).includes(value);
}

export function isActivityType(value: string): value is CrmActivityValue {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

export type CrmActor = { id: string };

// --- standalone leads ------------------------------------------------

export type CrmLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  source?: string;
  ownerId?: string | null;
};

function isUniqueConflict(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

export async function listCrmLeads(opts: { q?: string; stage?: string; ownerId?: string } = {}) {
  const q = opts.q?.trim();
  return prisma.crmLead.findMany({
    where: {
      ...(opts.stage && isLeadStage(opts.stage) ? { stage: opts.stage } : {}),
      ...(opts.ownerId ? { ownerId: opts.ownerId } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { source: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      owner: { select: { id: true, name: true } },
      convertedCustomer: { select: { id: true } },
    },
  });
}

export async function createCrmLead(input: CrmLeadInput, actor: CrmActor) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || fullName.length > 200) throw new ServiceError("INVALID_NAME", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new ServiceError("INVALID_EMAIL", 400);
  }
  const phone = input.phone?.trim() || null;
  const source = input.source?.trim() || null;
  if (phone && phone.length > 40) throw new ServiceError("INVALID_PHONE", 400);
  if (source && source.length > 120) throw new ServiceError("INVALID_SOURCE", 400);

  try {
    const lead = await prisma.crmLead.create({
      data: { fullName, email, phone, source, ownerId: input.ownerId || null },
      include: { owner: { select: { id: true, name: true } } },
    });
    await logAudit({
      actorId: actor.id,
      action: "crm.lead.create",
      entity: "CrmLead",
      entityId: lead.id,
      diff: { email, ownerId: lead.ownerId },
    });
    return lead;
  } catch (error) {
    if (isUniqueConflict(error)) throw new ServiceError("LEAD_EMAIL_EXISTS", 409);
    throw error;
  }
}

export async function updateCrmLead(
  id: string,
  input: { stage?: string; ownerId?: string | null },
  actor: CrmActor
) {
  if (input.stage !== undefined && !isLeadStage(input.stage)) {
    throw new ServiceError("INVALID_STAGE", 400);
  }
  const current = await prisma.crmLead.findUnique({
    where: { id },
    select: { id: true, convertedCustomerId: true },
  });
  if (!current) throw new ServiceError("NOT_FOUND", 404);
  if (!current.convertedCustomerId && input.stage === "WON") {
    throw new ServiceError("CONVERT_LEAD_BEFORE_WON", 409);
  }
  if (current.convertedCustomerId && input.stage && input.stage !== "WON") {
    throw new ServiceError("LEAD_ALREADY_CONVERTED", 409);
  }
  const updated = await prisma.crmLead.update({
    where: { id },
    data: {
      ...(input.stage !== undefined ? { stage: input.stage } : {}),
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId || null } : {}),
    },
    include: { owner: { select: { id: true, name: true } } },
  });
  await logAudit({
    actorId: actor.id,
    action: "crm.lead.update",
    entity: "CrmLead",
    entityId: id,
    diff: input as object,
  });
  return updated;
}

export async function convertCrmLead(id: string, actor: CrmActor) {
  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.crmLead.findUnique({ where: { id } });
    if (!lead) throw new ServiceError("NOT_FOUND", 404);
    if (lead.convertedCustomerId) {
      return { customerId: lead.convertedCustomerId, linkedExisting: true, alreadyConverted: true };
    }

    const existingUser = await tx.user.findUnique({
      where: { email: lead.email },
      select: { id: true, customer: { select: { id: true } } },
    });
    let customerId: string;
    const linkedExisting = Boolean(existingUser?.customer);
    if (existingUser?.customer) {
      customerId = existingUser.customer.id;
    } else if (existingUser) {
      throw new ServiceError("EMAIL_ACCOUNT_EXISTS", 409);
    } else {
      const user = await tx.user.create({
        data: {
          email: lead.email,
          name: lead.fullName,
          phone: lead.phone,
          passwordHash: null,
          roles: { create: { role: { connect: { name: "CUSTOMER" } } } },
          customer: {
            create: {
              fullName: lead.fullName,
              phone: lead.phone,
              source: lead.source,
              ownerId: lead.ownerId,
              stage: "WON",
            },
          },
        },
        select: { customer: { select: { id: true } } },
      });
      if (!user.customer) throw new Error("Converted user is missing its customer profile");
      customerId = user.customer.id;
    }

    await tx.crmLead.update({
      where: { id },
      data: { stage: "WON", convertedCustomerId: customerId },
    });
    await tx.crmActivity.create({
      data: {
        customerId,
        authorId: actor.id,
        type: "STAGE",
        body: `CRM lead converted: ${lead.fullName} (${lead.email})`,
      },
    });
    return { customerId, linkedExisting, alreadyConverted: false };
  });

  if (!result.alreadyConverted) {
    await logAudit({
      actorId: actor.id,
      action: "crm.lead.convert",
      entity: "CrmLead",
      entityId: id,
      diff: { customerId: result.customerId, linkedExisting: result.linkedExisting },
    });
  }
  return result;
}

// --- lookups --------------------------------------------------------

export async function listCrmStaff() {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      roles: {
        some: { role: { name: { in: ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"] } } },
      },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return users;
}

export async function listCrmTags() {
  return prisma.crmTag.findMany({ orderBy: { name: "asc" } });
}

export async function ensureTag(name: string): Promise<string> {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new ServiceError("INVALID_TAG", 400);
  const existing = await prisma.crmTag.findUnique({ where: { name: clean } });
  if (existing) return existing.id;
  const created = await prisma.crmTag.create({ data: { name: clean } });
  return created.id;
}

// --- dashboard ------------------------------------------------------

export async function getCrmDashboard() {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);

  const [stageGroups, totalClients, openTasks, dueSoon, recentActivities, recentClients, pipelineRows] =
    await Promise.all([
      prisma.customer.groupBy({
        by: ["stage"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.crmTask.count({ where: { status: "OPEN" } }),
      prisma.crmTask.findMany({
        where: { status: "OPEN", dueAt: { not: null, lte: weekAhead } },
        orderBy: { dueAt: "asc" },
        take: 8,
        include: {
          customer: { select: { id: true, fullName: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      prisma.crmActivity.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          customer: { select: { id: true, fullName: true } },
          author: { select: { id: true, name: true } },
        },
      }),
      prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, fullName: true, stage: true, createdAt: true, city: true, country: true },
      }),
      prisma.customer.findMany({
        where: { deletedAt: null, stage: { in: ACTIVE_STAGES } },
        select: {
          bookings: { where: { deletedAt: null }, select: { totalMinor: true } },
          tripPlans: { select: { totalMinor: true } },
        },
      }),
    ]);

  const byStage = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStageValue, number>;
  for (const g of stageGroups) byStage[g.stage as LeadStageValue] = g._count._all;

  const pipelineMinor = pipelineRows.reduce((sum, c) => {
    const bookings = c.bookings.reduce((s, b) => s + b.totalMinor, 0);
    const plans = c.tripPlans.reduce((s, p) => s + p.totalMinor, 0);
    return sum + Math.max(bookings, plans);
  }, 0);

  return {
    totalClients,
    byStage,
    openTasks,
    dueSoon: dueSoon.map((t) => ({
      ...t,
      overdue: t.dueAt ? t.dueAt.getTime() < now.getTime() : false,
    })),
    recentActivities,
    recentClients,
    pipelineMinor,
  };
}

// --- clients --------------------------------------------------------

export async function listCrmClients(opts: {
  q?: string;
  stage?: string;
  tagId?: string;
  ownerId?: string;
} = {}) {
  const q = opts.q?.trim();
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(opts.stage && isLeadStage(opts.stage) ? { stage: opts.stage } : {}),
      ...(opts.ownerId ? { ownerId: opts.ownerId } : {}),
      ...(opts.tagId ? { tags: { some: { tagId: opts.tagId } } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
              { city: { contains: q } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      phone: true,
      city: true,
      country: true,
      stage: true,
      source: true,
      lastContactedAt: true,
      createdAt: true,
      user: { select: { email: true, status: true } },
      owner: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
      bookings: {
        where: { deletedAt: null },
        select: { totalMinor: true, status: true, date: true },
      },
      _count: { select: { bookings: true, tripPlans: true, crmActivities: true, crmTasks: true } },
    },
  });

  return customers.map((c) => {
    const spentMinor = c.bookings
      .filter((b) => ["PAID", "COMPLETED", "CONFIRMED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalMinor, 0);
    const lastBookingAt = c.bookings.reduce<Date | null>(
      (latest, b) => (!latest || b.date > latest ? b.date : latest),
      null
    );
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.user.email,
      userStatus: c.user.status,
      phone: c.phone,
      city: c.city,
      country: c.country,
      stage: c.stage,
      source: c.source,
      owner: c.owner,
      tags: c.tags.map((t) => t.tag),
      bookingCount: c._count.bookings,
      tripPlanCount: c._count.tripPlans,
      activityCount: c._count.crmActivities,
      openTaskCount: c._count.crmTasks,
      spentMinor,
      lastBookingAt,
      lastContactedAt: c.lastContactedAt,
      createdAt: c.createdAt,
    };
  });
}

export type CrmClientRow = Awaited<ReturnType<typeof listCrmClients>>[number];

export async function getCrmClient(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true, emailVerifiedAt: true, avatarUrl: true, createdAt: true } },
      owner: { select: { id: true, name: true } },
      tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
      bookings: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
          date: true,
          totalMinor: true,
          currency: true,
          experience: { select: { title: true } },
        },
      },
      tripPlans: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, shareSlug: true, days: true, totalMinor: true, currency: true, createdAt: true },
      },
      reviews: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, title: true, status: true, createdAt: true },
      },
      crmActivities: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      crmTasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        include: { assignee: { select: { id: true, name: true } } },
      },
    },
  });
  if (!customer || customer.deletedAt) return null;

  const messages = await prisma.contactMessage.findMany({
    where: { email: customer.user.email },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return {
    ...customer,
    tags: customer.tags.map((t) => t.tag),
    messages,
    spentMinor: customer.bookings
      .filter((b) => ["PAID", "COMPLETED", "CONFIRMED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalMinor, 0),
  };
}

export type CrmClientDetail = NonNullable<Awaited<ReturnType<typeof getCrmClient>>>;

export async function updateCrmClient(
  id: string,
  input: { stage?: string; source?: string | null; ownerId?: string | null; tagIds?: string[] },
  actor: CrmActor
) {
  const current = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, stage: true, deletedAt: true },
  });
  if (!current || current.deletedAt) throw new ServiceError("NOT_FOUND", 404);

  if (input.stage && !isLeadStage(input.stage)) throw new ServiceError("INVALID_STAGE", 400);

  const data: Prisma.CustomerUncheckedUpdateInput = {};
  if (input.stage !== undefined) data.stage = input.stage as NonNullable<Prisma.CustomerUncheckedUpdateInput["stage"]>;
  if (input.source !== undefined) data.source = input.source?.trim() || null;
  if (input.ownerId !== undefined) data.ownerId = input.ownerId || null;

  const stageChanged = input.stage !== undefined && input.stage !== current.stage;
  if (stageChanged) data.lastContactedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({ where: { id }, data });
    if (input.tagIds !== undefined) {
      await tx.customerTag.deleteMany({ where: { customerId: id } });
      const unique = [...new Set(input.tagIds)].filter(Boolean);
      if (unique.length) {
        await tx.customerTag.createMany({
          data: unique.map((tagId) => ({ customerId: id, tagId })),
          skipDuplicates: true,
        });
      }
    }
    if (stageChanged) {
      await tx.crmActivity.create({
        data: {
          customerId: id,
          authorId: actor.id,
          type: "STAGE",
          body: `Stage: ${current.stage} → ${input.stage}`,
        },
      });
    }
  });

  await logAudit({
    actorId: actor.id,
    action: "crm.client.update",
    entity: "Customer",
    entityId: id,
    diff: { ...data, tagIds: input.tagIds } as object,
  });
  return { id };
}

// --- activities -----------------------------------------------------

export async function addCrmActivity(
  input: { customerId: string; type: string; body: string },
  actor: CrmActor
) {
  const body = input.body.trim();
  if (!body) throw new ServiceError("EMPTY_BODY", 400);
  if (!isActivityType(input.type)) throw new ServiceError("INVALID_TYPE", 400);
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, deletedAt: true },
  });
  if (!customer || customer.deletedAt) throw new ServiceError("NOT_FOUND", 404);

  const activity = await prisma.crmActivity.create({
    data: { customerId: input.customerId, authorId: actor.id, type: input.type, body },
    include: { author: { select: { id: true, name: true } } },
  });
  await prisma.customer.update({
    where: { id: input.customerId },
    data: { lastContactedAt: new Date() },
  });
  await logAudit({
    actorId: actor.id,
    action: "crm.activity.create",
    entity: "Customer",
    entityId: input.customerId,
    diff: { type: input.type },
  });
  return activity;
}

export async function deleteCrmActivity(id: string, actor: CrmActor) {
  await prisma.crmActivity.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await logAudit({ actorId: actor.id, action: "crm.activity.delete", entity: "CrmActivity", entityId: id });
}

// --- tasks ----------------------------------------------------------

export async function listCrmTasks(opts: { status?: string; assigneeId?: string } = {}) {
  return prisma.crmTask.findMany({
    where: {
      ...(opts.status ? { status: opts.status === "DONE" ? "DONE" : "OPEN" } : {}),
      ...(opts.assigneeId ? { assigneeId: opts.assigneeId } : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      customer: { select: { id: true, fullName: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
}

export async function createCrmTask(
  input: { customerId: string; title: string; dueAt?: string | null; assigneeId?: string | null },
  actor: CrmActor
) {
  const title = input.title.trim();
  if (!title) throw new ServiceError("EMPTY_TITLE", 400);
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, deletedAt: true },
  });
  if (!customer || customer.deletedAt) throw new ServiceError("NOT_FOUND", 404);

  const task = await prisma.crmTask.create({
    data: {
      customerId: input.customerId,
      title: title.slice(0, 200),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      assigneeId: input.assigneeId || null,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });
  await logAudit({
    actorId: actor.id,
    action: "crm.task.create",
    entity: "CrmTask",
    entityId: task.id,
    diff: { customerId: input.customerId, title },
  });
  return task;
}

export async function updateCrmTask(
  id: string,
  input: { title?: string; status?: string; dueAt?: string | null; assigneeId?: string | null },
  actor: CrmActor
) {
  const data: Prisma.CrmTaskUncheckedUpdateInput = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new ServiceError("EMPTY_TITLE", 400);
    data.title = title.slice(0, 200);
  }
  if (input.status !== undefined) {
    const status = input.status === "DONE" ? "DONE" : "OPEN";
    data.status = status;
    data.completedAt = status === "DONE" ? new Date() : null;
  }
  if (input.dueAt !== undefined) data.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId || null;

  const task = await prisma.crmTask.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  });
  await logAudit({ actorId: actor.id, action: "crm.task.update", entity: "CrmTask", entityId: id, diff: data as object });
  return task;
}

export async function deleteCrmTask(id: string, actor: CrmActor) {
  await prisma.crmTask.delete({ where: { id } }).catch((err) => {
    if ((err as { code?: string }).code !== "P2025") throw err;
  });
  await logAudit({ actorId: actor.id, action: "crm.task.delete", entity: "CrmTask", entityId: id });
}
