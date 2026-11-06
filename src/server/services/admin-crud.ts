import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "./audit";
import type { Prisma } from "@/generated/prisma/client";
import type { RoleName } from "@/types/next-auth";

// ------------------------------------------------------------
// Generic admin CRUD registry.
// One handler per resource key; the API route dispatches on the key.
// AuthZ (minRole) is enforced by the route, audit logging by handlers.
// ------------------------------------------------------------

export type Actor = { id: string; roles: RoleName[] };

export class ValidationError extends Error {
  details?: unknown;
  constructor(message = "Validation failed", details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export type ResourceHandler = {
  entity: string;
  minRole: RoleName;
  get(id: string): Promise<Record<string, unknown> | null>;
  create(body: unknown, actor: Actor): Promise<{ id: string }>;
  update(id: string, body: unknown, actor: Actor): Promise<{ id: string }>;
  remove(id: string, actor: Actor): Promise<void>;
};

function parse<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError("Validation failed", result.error.flatten());
  return result.data;
}

function prismaCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string" && /^P\d{4}$/.test(code)) return code;
  }
  return null;
}

export { prismaCode };

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// --- field builders -------------------------------------------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Required trimmed text. */
const text = (max: number, min = 1) => z.string().trim().min(min).max(max);
/** Optional text → null when blank. */
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));
/** Optional int → null when blank; omitted keys keep Prisma defaults. */
const optInt = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullable().optional();
const int = (min: number, max: number, def?: number) => {
  const base = z.number().int().min(min).max(max);
  return def !== undefined ? base.default(def) : base;
};
const bool = (def?: boolean) => {
  const base = z.boolean();
  return def !== undefined ? base.default(def) : base;
};
const dateOnly = z
  .string()
  .regex(DATE_RE)
  .transform((s) => new Date(s));
const optDateOnly = z
  .string()
  .regex(DATE_RE)
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : null));
const contentStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const slugField = z
  .string()
  .trim()
  .max(120)
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() ? slugify(v) : null));
const nullableId = z.string().trim().min(1).nullable().optional();

function withMedia(
  row: Record<string, unknown>,
  paths: Record<string, string | null>
): Record<string, unknown> {
  return { ...row, __media: paths };
}

/** Prisma known-error mapping helper used by the API route. */
export function friendlyPrismaError(code: string | null): string | null {
  if (code === "P2002") return "A record with this unique value already exists.";
  if (code === "P2003") return "Related record not found.";
  if (code === "P2025") return "Record not found.";
  return null;
}

// ------------------------------------------------------------
// Resources
// ------------------------------------------------------------

const categories: ResourceHandler = {
  entity: "ExperienceCategory",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.experienceCategory.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        position: true,
        status: true,
        coverImageId: true,
        deletedAt: true,
        coverImage: { select: { path: true } },
      },
    });
    if (!row || row.deletedAt) return null;
    return withMedia(row, { coverImageId: row.coverImage?.path ?? null });
  },
  async create(body) {
    const data = parse(
      z.object({
        name: text(120, 2),
        slug: slugField,
        description: optText(512),
        icon: optText(60),
        position: int(0, 9999, 0),
        status: contentStatus.default("PUBLISHED"),
        coverImageId: nullableId,
      }),
      body
    );
    const row = await prisma.experienceCategory.create({
      data: { ...data, slug: data.slug ?? slugify(data.name) },
      select: { id: true },
    });
    await logAudit({ action: "categories.create", entity: "ExperienceCategory", entityId: row.id, diff: { name: data.name } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          name: text(120, 2),
          slug: slugField,
          description: optText(512),
          icon: optText(60),
          position: int(0, 9999),
          status: contentStatus,
          coverImageId: nullableId,
        })
        .partial(),
      body
    );
    const row = await prisma.experienceCategory.update({
      where: { id },
      data: data as Prisma.ExperienceCategoryUncheckedUpdateInput,
      select: { id: true },
    });
    await logAudit({ action: "categories.update", entity: "ExperienceCategory", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.experienceCategory.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await logAudit({ action: "categories.delete", entity: "ExperienceCategory", entityId: id });
  },
};

const destinations: ResourceHandler = {
  entity: "Destination",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.destination.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        region: true,
        country: true,
        description: true,
        shortIntro: true,
        bestSeason: true,
        duration: true,
        position: true,
        status: true,
        featured: true,
        seoTitle: true,
        seoDescription: true,
        coverImageId: true,
        deletedAt: true,
        coverImage: { select: { path: true } },
      },
    });
    if (!row || row.deletedAt) return null;
    return withMedia(row, { coverImageId: row.coverImage?.path ?? null });
  },
  async create(body) {
    const data = parse(
      z.object({
        name: text(120, 2),
        slug: slugField,
        region: optText(120),
        country: z.string().trim().max(80).optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
        description: optText(5000),
        shortIntro: optText(400),
        bestSeason: optText(120),
        duration: optText(60),
        position: int(0, 9999, 0),
        status: contentStatus.default("PUBLISHED"),
        featured: bool(false),
        seoTitle: optText(180),
        seoDescription: optText(320),
        coverImageId: nullableId,
      }),
      body
    );
    const row = await prisma.destination.create({
      data: {
        ...data,
        slug: data.slug ?? slugify(data.name),
        country: data.country ?? "Morocco",
      },
      select: { id: true },
    });
    await logAudit({ action: "destinations.create", entity: "Destination", entityId: row.id, diff: { name: data.name } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          name: text(120, 2),
          slug: slugField,
          region: optText(120),
          country: z.string().trim().max(80).optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
          description: optText(5000),
          shortIntro: optText(400),
          bestSeason: optText(120),
          duration: optText(60),
          position: int(0, 9999),
          status: contentStatus,
          featured: bool(),
          seoTitle: optText(180),
          seoDescription: optText(320),
          coverImageId: nullableId,
        })
        .partial(),
      body
    );
    const row = await prisma.destination.update({ where: { id }, data: data as Prisma.DestinationUncheckedUpdateInput, select: { id: true } });
    await logAudit({ action: "destinations.update", entity: "Destination", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.destination.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "destinations.delete", entity: "Destination", entityId: id });
  },
};

const experienceSchema = z.object({
  title: text(200, 3),
  slug: slugField,
  summary: optText(400),
  description: text(20000, 10),
  categoryId: text(64),
  destinationId: text(64),
  durationMinutes: int(5, 40320, 240),
  priceMinor: int(0, 10_000_000_000),
  capacityMin: int(1, 1000, 1),
  capacityMax: int(1, 1000, 12),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING", "DEMANDING"]).default("MODERATE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: bool(false),
  meetingPoint: optText(255),
  pickupIncluded: bool(true),
  cancelWindowHours: int(0, 8760, 48),
  minBookingNoticeHours: int(0, 8760, 24),
  coverImageId: nullableId,
});

const experiences: ResourceHandler = {
  entity: "Experience",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.experience.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        categoryId: true,
        destinationId: true,
        durationMinutes: true,
        priceMinor: true,
        capacityMin: true,
        capacityMax: true,
        difficulty: true,
        status: true,
        featured: true,
        meetingPoint: true,
        pickupIncluded: true,
        cancelWindowHours: true,
        minBookingNoticeHours: true,
        coverImageId: true,
        deletedAt: true,
        coverImage: { select: { path: true } },
      },
    });
    if (!row || row.deletedAt) return null;
    return withMedia(row, { coverImageId: row.coverImage?.path ?? null });
  },
  async create(body) {
    const data = parse(experienceSchema, body);
    const row = await prisma.experience.create({
      data: { ...data, slug: data.slug ?? slugify(data.title) },
      select: { id: true },
    });
    await logAudit({ action: "experiences.create", entity: "Experience", entityId: row.id, diff: { title: data.title } });
    return row;
  },
  async update(id, body) {
    const data = parse(experienceSchema.partial(), body);
    const row = await prisma.experience.update({ where: { id }, data: data as Prisma.ExperienceUncheckedUpdateInput, select: { id: true } });
    await logAudit({ action: "experiences.update", entity: "Experience", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.experience.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "experiences.delete", entity: "Experience", entityId: id });
  },
};

const tours: ResourceHandler = {
  entity: "Tour",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.tour.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        experienceId: true,
        destinationId: true,
        status: true,
        priceMinor: true,
        capacity: true,
        coverImageId: true,
        deletedAt: true,
        coverImage: { select: { path: true } },
      },
    });
    if (!row || row.deletedAt) return null;
    return withMedia(row, { coverImageId: row.coverImage?.path ?? null });
  },
  async create(body) {
    const data = parse(
      z.object({
        title: text(200, 3),
        slug: slugField,
        description: text(20000, 10),
        experienceId: text(64),
        destinationId: text(64),
        priceMinor: int(0, 10_000_000_000),
        capacity: int(1, 1000, 12),
        status: contentStatus.default("DRAFT"),
        coverImageId: nullableId,
      }),
      body
    );
    const row = await prisma.tour.create({
      data: { ...data, slug: data.slug ?? slugify(data.title) },
      select: { id: true },
    });
    await logAudit({ action: "tours.create", entity: "Tour", entityId: row.id, diff: { title: data.title } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          title: text(200, 3),
          slug: slugField,
          description: text(20000, 10),
          experienceId: text(64),
          destinationId: text(64),
          priceMinor: int(0, 10_000_000_000),
          capacity: int(1, 1000),
          status: contentStatus,
          coverImageId: nullableId,
        })
        .partial(),
      body
    );
    const row = await prisma.tour.update({ where: { id }, data: data as Prisma.TourUncheckedUpdateInput, select: { id: true } });
    await logAudit({ action: "tours.update", entity: "Tour", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.tour.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "tours.delete", entity: "Tour", entityId: id });
  },
};

const availability: ResourceHandler = {
  entity: "Availability",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.availability.findUnique({
      where: { id },
      select: { id: true, experienceId: true, date: true, capacityTotal: true, capacityBooked: true, closed: true },
    });
    return row as Record<string, unknown> | null;
  },
  async create(body) {
    const data = parse(
      z.object({
        experienceId: text(64),
        startDate: dateOnly,
        endDate: dateOnly,
        capacityTotal: int(1, 10000),
        closed: bool(false),
      }),
      body
    );
    if (data.endDate < data.startDate) {
      throw new ValidationError("End date cannot be before the start date.");
    }
    const days = Math.round((data.endDate.getTime() - data.startDate.getTime()) / 86_400_000) + 1;
    if (days > 366) {
      throw new ValidationError("Range too large (max 366 days).");
    }
    const rows: Prisma.AvailabilityCreateManyInput[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(data.startDate);
      date.setUTCDate(date.getUTCDate() + i);
      return {
        experienceId: data.experienceId,
        date,
        capacityTotal: data.capacityTotal,
        capacityBooked: 0,
        closed: data.closed,
      };
    });
    await prisma.availability.createMany({ data: rows, skipDuplicates: true });
    await logAudit({
      action: "availability.create",
      entity: "Availability",
      entityId: data.experienceId,
      diff: {
        start: data.startDate.toISOString().slice(0, 10),
        end: data.endDate.toISOString().slice(0, 10),
        days,
      },
    });
    return { id: data.experienceId };
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          experienceId: text(64),
          date: dateOnly,
          capacityTotal: int(1, 10000),
          closed: bool(),
        })
        .partial(),
      body
    );
    const row = await prisma.availability.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "availability.update", entity: "Availability", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.availability.delete({ where: { id } }).catch((err) => {
      if (prismaCode(err) !== "P2025") throw err;
    });
    await logAudit({ action: "availability.delete", entity: "Availability", entityId: id });
  },
};

const faqs: ResourceHandler = {
  entity: "Faq",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.faq.findUnique({
      where: { id },
      select: { id: true, question: true, answer: true, category: true, position: true, active: true, experienceId: true },
    });
    return row as Record<string, unknown> | null;
  },
  async create(body) {
    const data = parse(
      z.object({
        question: text(300, 3),
        answer: text(5000, 5),
        category: optText(80),
        position: int(0, 9999, 0),
        active: bool(true),
        experienceId: nullableId,
      }),
      body
    );
    const row = await prisma.faq.create({ data, select: { id: true } });
    await logAudit({ action: "faqs.create", entity: "Faq", entityId: row.id, diff: { question: data.question } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          question: text(300, 3),
          answer: text(5000, 5),
          category: optText(80),
          position: int(0, 9999),
          active: bool(),
          experienceId: nullableId,
        })
        .partial(),
      body
    );
    const row = await prisma.faq.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "faqs.update", entity: "Faq", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.faq.delete({ where: { id } }).catch((err) => {
      if (prismaCode(err) !== "P2025") throw err;
    });
    await logAudit({ action: "faqs.delete", entity: "Faq", entityId: id });
  },
};

const guideSchema = z.object({
  userId: text(64),
  bio: optText(5000),
  languages: optText(255),
  yearsExp: int(0, 80, 0),
  licenseNumber: optText(80),
  active: bool(true),
});

const guides: ResourceHandler = {
  entity: "Guide",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.guide.findUnique({
      where: { id },
      select: { id: true, userId: true, bio: true, languages: true, yearsExp: true, licenseNumber: true, active: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body) {
    const data = parse(guideSchema, body);
    const row = await prisma.guide.create({ data, select: { id: true } });
    await logAudit({ action: "guides.create", entity: "Guide", entityId: row.id, diff: { userId: data.userId } });
    return row;
  },
  async update(id, body) {
    const data = parse(guideSchema.omit({ userId: true }).partial(), body);
    const row = await prisma.guide.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "guides.update", entity: "Guide", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.guide.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "guides.delete", entity: "Guide", entityId: id });
  },
};

const vehicles: ResourceHandler = {
  entity: "Vehicle",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, categoryId: true, guideId: true, make: true, model: true, year: true, plate: true, seats: true, active: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body) {
    const data = parse(
      z.object({
        categoryId: text(64),
        guideId: nullableId,
        make: text(80, 1),
        model: text(80, 1),
        year: optInt(1950, 2100),
        plate: optText(30),
        seats: int(1, 100, 4),
        active: bool(true),
      }),
      body
    );
    const row = await prisma.vehicle.create({ data, select: { id: true } });
    await logAudit({ action: "vehicles.create", entity: "Vehicle", entityId: row.id, diff: { make: data.make, model: data.model } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          categoryId: text(64),
          guideId: nullableId,
          make: text(80, 1),
          model: text(80, 1),
          year: optInt(1950, 2100),
          plate: optText(30),
          seats: int(1, 100),
          active: bool(),
        })
        .partial(),
      body
    );
    const row = await prisma.vehicle.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "vehicles.update", entity: "Vehicle", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.vehicle.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "vehicles.delete", entity: "Vehicle", entityId: id });
  },
};

const pickup: ResourceHandler = {
  entity: "PickupLocation",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.pickupLocation.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, address: true, position: true, active: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body) {
    const data = parse(
      z.object({
        name: text(160, 2),
        description: optText(320),
        address: optText(255),
        position: int(0, 9999, 0),
        active: bool(true),
      }),
      body
    );
    const row = await prisma.pickupLocation.create({ data, select: { id: true } });
    await logAudit({ action: "pickup.create", entity: "PickupLocation", entityId: row.id, diff: { name: data.name } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          name: text(160, 2),
          description: optText(320),
          address: optText(255),
          position: int(0, 9999),
          active: bool(),
        })
        .partial(),
      body
    );
    const row = await prisma.pickupLocation.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "pickup.update", entity: "PickupLocation", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.pickupLocation.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "pickup.delete", entity: "PickupLocation", entityId: id });
  },
};

const posts: ResourceHandler = {
  entity: "BlogPost",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        authorName: true,
        status: true,
        categoryId: true,
        readingMinutes: true,
        seoTitle: true,
        seoDescription: true,
        coverImageId: true,
        publishedAt: true,
        deletedAt: true,
        coverImage: { select: { path: true } },
      },
    });
    if (!row || row.deletedAt) return null;
    return withMedia(row, { coverImageId: row.coverImage?.path ?? null });
  },
  async create(body) {
    const data = parse(
      z.object({
        title: text(200, 3),
        slug: slugField,
        excerpt: optText(400),
        body: text(100000, 10),
        authorName: optText(120),
        status: contentStatus.default("DRAFT"),
        categoryId: nullableId,
        readingMinutes: int(1, 600, 5),
        seoTitle: optText(180),
        seoDescription: optText(320),
        coverImageId: nullableId,
      }),
      body
    );
    const row = await prisma.blogPost.create({
      data: {
        ...data,
        slug: data.slug ?? slugify(data.title),
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
      select: { id: true },
    });
    await logAudit({ action: "posts.create", entity: "BlogPost", entityId: row.id, diff: { title: data.title } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          title: text(200, 3),
          slug: slugField,
          excerpt: optText(400),
          body: text(100000, 10),
          authorName: optText(120),
          status: contentStatus,
          categoryId: nullableId,
          readingMinutes: int(1, 600),
          seoTitle: optText(180),
          seoDescription: optText(320),
          coverImageId: nullableId,
        })
        .partial(),
      body
    );
    let publishStamp: Date | undefined;
    if (data.status === "PUBLISHED") {
      const current = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
      if (!current?.publishedAt) publishStamp = new Date();
    }
    const row = await prisma.blogPost.update({
      where: { id },
      data: { ...data, ...(publishStamp ? { publishedAt: publishStamp } : {}) } as Prisma.BlogPostUncheckedUpdateInput,
      select: { id: true },
    });
    await logAudit({ action: "posts.update", entity: "BlogPost", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.blogPost.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "posts.delete", entity: "BlogPost", entityId: id });
  },
};

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((v) => v.toUpperCase()),
  description: optText(320),
  percentOff: optInt(1, 100),
  fixedOffMinor: optInt(0, 100_000_000),
  redemptionLimit: optInt(1, 1_000_000),
  startsAt: optDateOnly,
  expiresAt: optDateOnly,
  active: bool(true),
});

const coupons: ResourceHandler = {
  entity: "Coupon",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, code: true, description: true, percentOff: true, fixedOffMinor: true, redemptionLimit: true, startsAt: true, expiresAt: true, active: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body) {
    const data = parse(couponSchema, body);
    const row = await prisma.coupon.create({ data, select: { id: true } });
    await logAudit({ action: "coupons.create", entity: "Coupon", entityId: row.id, diff: { code: data.code } });
    return row;
  },
  async update(id, body) {
    const data = parse(couponSchema.partial(), body);
    const row = await prisma.coupon.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "coupons.update", entity: "Coupon", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.coupon.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "coupons.delete", entity: "Coupon", entityId: id });
  },
};

const ROLE_NAMES = ["CUSTOMER", "GUIDE", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"] as const;

const users: ResourceHandler = {
  entity: "User",
  minRole: "MANAGER",
  async get(id) {
    const row = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, status: true, locale: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body, actor) {
    const data = parse(
      z.object({
        name: text(120, 2),
        email: z.string().trim().toLowerCase().max(255).email(),
        password: z.string().min(8).max(128),
        phone: optText(40),
        locale: z.enum(["en", "fr", "ar"]).default("en"),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
        role: z.enum(ROLE_NAMES).default("CUSTOMER"),
      }),
      body
    );
    if (["ADMIN", "SUPER_ADMIN"].includes(data.role) && !actor.roles.includes("SUPER_ADMIN")) {
      throw new ValidationError("Only a super admin can create admin accounts.");
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const row = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone ?? null,
        locale: data.locale,
        status: data.status,
        emailVerifiedAt: new Date(),
        roles: { create: { role: { connect: { name: data.role } } } },
      },
      select: { id: true },
    });
    await logAudit({ action: "users.create", entity: "User", entityId: row.id, diff: { email: data.email, role: data.role } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          name: text(120, 2),
          email: z.string().trim().toLowerCase().max(255).email(),
          password: z.string().min(8).max(128),
          phone: optText(40),
          locale: z.enum(["en", "fr", "ar"]),
          status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
        })
        .partial(),
      body
    );
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const row = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: { id: true },
    });
    await logAudit({
      action: "users.update",
      entity: "User",
      entityId: id,
      diff: { ...data, ...(data.password ? { password: "[redacted]" } : {}) } as object,
    });
    return row;
  },
  async remove(id, actor) {
    if (id === actor.id) throw new ValidationError("You cannot delete your own account.");
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, deletedAt: true, roles: { select: { role: { select: { name: true } } } } },
    });
    if (!target || target.deletedAt) return;
    const isSuper = target.roles.some((r) => r.role.name === "SUPER_ADMIN");
    if (isSuper && !actor.roles.includes("SUPER_ADMIN")) {
      throw new ValidationError("Only a super admin can delete a super admin account.");
    }
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
    await logAudit({ action: "users.delete", entity: "User", entityId: id, diff: { email: target ? undefined : undefined } });
  },
};

const customers: ResourceHandler = {
  entity: "Customer",
  minRole: "STAFF",
  async get(id) {
    const row = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, fullName: true, phone: true, country: true, city: true, locale: true, notes: true, deletedAt: true },
    });
    if (!row || row.deletedAt) return null;
    return row as Record<string, unknown>;
  },
  async create(body) {
    const data = parse(
      z.object({
        userId: text(64),
        fullName: text(160, 2),
        phone: optText(40),
        country: optText(2),
        city: optText(120),
        locale: z.enum(["en", "fr", "ar"]).default("en"),
        notes: optText(5000),
      }),
      body
    );
    const row = await prisma.customer.create({ data, select: { id: true } });
    await logAudit({ action: "customers.create", entity: "Customer", entityId: row.id, diff: { fullName: data.fullName } });
    return row;
  },
  async update(id, body) {
    const data = parse(
      z
        .object({
          fullName: text(160, 2),
          phone: optText(40),
          country: optText(2),
          city: optText(120),
          locale: z.enum(["en", "fr", "ar"]),
          notes: optText(5000),
        })
        .partial(),
      body
    );
    const row = await prisma.customer.update({ where: { id }, data, select: { id: true } });
    await logAudit({ action: "customers.update", entity: "Customer", entityId: id, diff: data as object });
    return row;
  },
  async remove(id) {
    await prisma.customer.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    await logAudit({ action: "customers.delete", entity: "Customer", entityId: id });
  },
};

// --- delete-only resources ----------------------------------------

function deleteOnly(entity: string, run: (id: string) => Promise<void>, action: string): ResourceHandler {
  return {
    entity,
    minRole: "STAFF",
    async get(id) {
      return { id };
    },
    async create() {
      throw new ValidationError("Create is not supported for this resource.");
    },
    async update() {
      throw new ValidationError("Update is not supported for this resource.");
    },
    async remove(id) {
      await run(id);
      await logAudit({ action, entity, entityId: id });
    },
  };
}

const messages = deleteOnly("ContactMessage", async (id) => {
  await prisma.contactMessage.delete({ where: { id } }).catch((err) => {
    if (prismaCode(err) !== "P2025") throw err;
  });
}, "messages.delete");

const notifications = deleteOnly("Notification", async (id) => {
  await prisma.notification.delete({ where: { id } }).catch((err) => {
    if (prismaCode(err) !== "P2025") throw err;
  });
}, "notifications.delete");

const bookings = deleteOnly("Booking", async (id) => {
  await prisma.booking.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
}, "bookings.delete");

const reviews = deleteOnly("Review", async (id) => {
  await prisma.review.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
}, "reviews.delete");

// ------------------------------------------------------------

export const resources: Record<string, ResourceHandler> = {
  categories,
  destinations,
  experiences,
  tours,
  availability,
  faqs,
  guides,
  vehicles,
  pickup,
  posts,
  coupons,
  users,
  customers,
  messages,
  notifications,
  bookings,
  reviews,
};

export function getResource(key: string): ResourceHandler | null {
  return resources[key] ?? null;
}
