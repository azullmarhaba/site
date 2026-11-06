import type { Dictionary } from "@/lib/i18n";

// Shared (server-safe) CRUD field builders.
// Pages call the matching builder and pass the result to ResourceCrud controls.
// Keep these in sync with the Zod schemas in src/server/services/admin-crud.ts.

export type CrudFieldOption = { value: string; label: string };

export type CrudField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "media" | "password";
  required?: boolean;
  nullable?: boolean;
  placeholder?: string;
  options?: CrudFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  span?: 1 | 2;
  money?: boolean;
  defaultValue?: string | number | boolean;
  createOnly?: boolean;
  editOnly?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  hint?: string;
};

export type CrudLabels = {
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  close: string;
  loading: string;
  created: string;
  saved: string;
  deleted: string;
  error: string;
  deleteConfirm: string;
  upload: string;
  uploading: string;
  library: string;
  choose: string;
  clear: string;
  noImage: string;
  notFound: string;
  slugAuto: string;
  pickTitle: string;
  required: string;
};

type Opt = { value: string; label: string };

function statusOptions(t: Dictionary): Opt[] {
  const c = t.admin.crud.status;
  return [
    { value: "DRAFT", label: c.DRAFT },
    { value: "PUBLISHED", label: c.PUBLISHED },
    { value: "ARCHIVED", label: c.ARCHIVED },
  ];
}

export function categoriesFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "name", label: f.name, type: "text", required: true, maxLength: 120, span: 2 },
    { name: "slug", label: f.slug, type: "text", maxLength: 120, hint: t.admin.crud.slugAuto },
    { name: "icon", label: f.icon, type: "text", maxLength: 60 },
    { name: "description", label: f.description, type: "textarea", maxLength: 512, rows: 3, span: 2 },
    { name: "position", label: f.position, type: "number", min: 0, max: 9999, defaultValue: 0 },
    { name: "status", label: f.status, type: "select", options: statusOptions(t), defaultValue: "PUBLISHED" },
    { name: "coverImageId", label: f.coverImage, type: "media", nullable: true, span: 2 },
  ];
}

export function destinationsFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "name", label: f.name, type: "text", required: true, maxLength: 120, span: 2 },
    { name: "slug", label: f.slug, type: "text", maxLength: 120, hint: t.admin.crud.slugAuto },
    { name: "region", label: f.region, type: "text", maxLength: 120 },
    { name: "country", label: f.country, type: "text", maxLength: 80, defaultValue: "Morocco" },
    { name: "bestSeason", label: f.bestSeason, type: "text", maxLength: 120 },
    { name: "duration", label: f.duration, type: "text", maxLength: 60 },
    { name: "shortIntro", label: f.shortIntro, type: "text", maxLength: 400, span: 2 },
    { name: "description", label: f.description, type: "textarea", maxLength: 5000, rows: 4, span: 2 },
    { name: "position", label: f.position, type: "number", min: 0, max: 9999, defaultValue: 0 },
    { name: "status", label: f.status, type: "select", options: statusOptions(t), defaultValue: "PUBLISHED" },
    { name: "seoTitle", label: f.seoTitle, type: "text", maxLength: 180 },
    { name: "seoDescription", label: f.seoDescription, type: "text", maxLength: 320 },
    { name: "featured", label: f.featured, type: "checkbox" },
    { name: "coverImageId", label: f.coverImage, type: "media", nullable: true, span: 2 },
  ];
}

export function experiencesFields(
  t: Dictionary,
  opts: { categories: Opt[]; destinations: Opt[] }
): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "title", label: f.title, type: "text", required: true, maxLength: 200, span: 2 },
    { name: "slug", label: f.slug, type: "text", maxLength: 120, hint: t.admin.crud.slugAuto },
    { name: "categoryId", label: f.category, type: "select", options: opts.categories, required: true },
    { name: "destinationId", label: f.destination, type: "select", options: opts.destinations, required: true },
    { name: "summary", label: f.summary, type: "text", maxLength: 400, span: 2 },
    { name: "description", label: f.description, type: "textarea", required: true, rows: 5, span: 2 },
    { name: "durationMinutes", label: f.durationMinutes, type: "number", min: 5, max: 40320, defaultValue: 240 },
    { name: "priceMinor", label: f.price, type: "number", money: true, min: 0, defaultValue: 0 },
    { name: "capacityMin", label: f.capacityMin, type: "number", min: 1, max: 1000, defaultValue: 1 },
    { name: "capacityMax", label: f.capacityMax, type: "number", min: 1, max: 1000, defaultValue: 12 },
    { name: "difficulty", label: f.difficulty, type: "select", options: ["EASY", "MODERATE", "CHALLENGING", "DEMANDING"].map((v) => ({ value: v, label: t.admin.crud.difficulty[v as keyof typeof t.admin.crud.difficulty] })), defaultValue: "MODERATE" },
    { name: "status", label: f.status, type: "select", options: statusOptions(t), defaultValue: "DRAFT" },
    { name: "meetingPoint", label: f.meetingPoint, type: "text", maxLength: 255, span: 2 },
    { name: "cancelWindowHours", label: f.cancelWindowHours, type: "number", min: 0, max: 8760, defaultValue: 48 },
    { name: "minBookingNoticeHours", label: f.minBookingNoticeHours, type: "number", min: 0, max: 8760, defaultValue: 24 },
    { name: "pickupIncluded", label: f.pickupIncluded, type: "checkbox", defaultValue: true },
    { name: "featured", label: f.featured, type: "checkbox" },
    { name: "coverImageId", label: f.coverImage, type: "media", nullable: true, span: 2 },
  ];
}

export function toursFields(
  t: Dictionary,
  opts: { experiences: Opt[]; destinations: Opt[] }
): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "title", label: f.title, type: "text", required: true, maxLength: 200, span: 2 },
    { name: "slug", label: f.slug, type: "text", maxLength: 120, hint: t.admin.crud.slugAuto },
    { name: "experienceId", label: f.experience, type: "select", options: opts.experiences, required: true },
    { name: "destinationId", label: f.destination, type: "select", options: opts.destinations, required: true },
    { name: "description", label: f.description, type: "textarea", required: true, rows: 5, span: 2 },
    { name: "priceMinor", label: f.price, type: "number", money: true, min: 0, defaultValue: 0 },
    { name: "capacity", label: f.capacityTotal, type: "number", min: 1, max: 1000, defaultValue: 12 },
    { name: "status", label: f.status, type: "select", options: statusOptions(t), defaultValue: "DRAFT" },
    { name: "coverImageId", label: f.coverImage, type: "media", nullable: true, span: 2 },
  ];
}

export function availabilityFields(t: Dictionary, opts: { experiences: Opt[] }): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "experienceId", label: f.experience, type: "select", options: opts.experiences, required: true, span: 2 },
    { name: "date", label: f.date, type: "date", required: true, editOnly: true },
    { name: "startDate", label: f.startDate, type: "date", required: true, createOnly: true },
    { name: "endDate", label: f.endDate, type: "date", required: true, createOnly: true },
    { name: "capacityTotal", label: f.capacityTotal, type: "number", min: 1, max: 10000, defaultValue: 12 },
    { name: "closed", label: f.closed, type: "checkbox" },
  ];
}

export function faqsFields(t: Dictionary, opts: { experiences: Opt[] }): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "question", label: f.question, type: "text", required: true, maxLength: 300, span: 2 },
    { name: "answer", label: f.answer, type: "textarea", required: true, rows: 4, span: 2 },
    { name: "category", label: f.category, type: "text", maxLength: 80 },
    { name: "experienceId", label: f.experience, type: "select", options: opts.experiences, nullable: true },
    { name: "position", label: f.position, type: "number", min: 0, max: 9999, defaultValue: 0 },
    { name: "active", label: f.active, type: "checkbox", defaultValue: true },
  ];
}

export function guidesFields(t: Dictionary, opts: { users: Opt[] }): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "userId", label: f.user, type: "select", options: opts.users, required: true, createOnly: true, span: 2 },
    { name: "bio", label: f.bio, type: "textarea", rows: 4, maxLength: 5000, span: 2 },
    { name: "languages", label: f.languages, type: "text", maxLength: 255 },
    { name: "yearsExp", label: f.yearsExp, type: "number", min: 0, max: 80, defaultValue: 0 },
    { name: "licenseNumber", label: f.licenseNumber, type: "text", maxLength: 80 },
    { name: "active", label: f.active, type: "checkbox", defaultValue: true },
  ];
}

export function vehiclesFields(
  t: Dictionary,
  opts: { categories: Opt[]; guides: Opt[] }
): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "categoryId", label: f.category, type: "select", options: opts.categories, required: true },
    { name: "guideId", label: f.guide, type: "select", options: opts.guides, nullable: true },
    { name: "make", label: f.make, type: "text", required: true, maxLength: 80 },
    { name: "model", label: f.model, type: "text", required: true, maxLength: 80 },
    { name: "year", label: f.year, type: "number", min: 1950, max: 2100, nullable: true },
    { name: "plate", label: f.plate, type: "text", maxLength: 30 },
    { name: "seats", label: f.seats, type: "number", min: 1, max: 100, defaultValue: 4 },
    { name: "active", label: f.active, type: "checkbox", defaultValue: true },
  ];
}

export function pickupFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "name", label: f.name, type: "text", required: true, maxLength: 160, span: 2 },
    { name: "description", label: f.description, type: "text", maxLength: 320, span: 2 },
    { name: "address", label: f.address, type: "text", maxLength: 255, span: 2 },
    { name: "position", label: f.position, type: "number", min: 0, max: 9999, defaultValue: 0 },
    { name: "active", label: f.active, type: "checkbox", defaultValue: true },
  ];
}

export function postsFields(t: Dictionary, opts: { categories: Opt[] }): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "title", label: f.title, type: "text", required: true, maxLength: 200, span: 2 },
    { name: "slug", label: f.slug, type: "text", maxLength: 120, hint: t.admin.crud.slugAuto },
    { name: "categoryId", label: f.category, type: "select", options: opts.categories, nullable: true },
    { name: "authorName", label: f.authorName, type: "text", maxLength: 120 },
    { name: "excerpt", label: f.excerpt, type: "text", maxLength: 400, span: 2 },
    { name: "body", label: f.body, type: "textarea", required: true, rows: 8, span: 2 },
    { name: "readingMinutes", label: f.readingMinutes, type: "number", min: 1, max: 600, defaultValue: 5 },
    { name: "status", label: f.status, type: "select", options: statusOptions(t), defaultValue: "DRAFT" },
    { name: "seoTitle", label: f.seoTitle, type: "text", maxLength: 180, span: 2 },
    { name: "seoDescription", label: f.seoDescription, type: "text", maxLength: 320, span: 2 },
    { name: "coverImageId", label: f.coverImage, type: "media", nullable: true, span: 2 },
  ];
}

export function couponsFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "code", label: f.code, type: "text", required: true, maxLength: 30, span: 2 },
    { name: "description", label: f.description, type: "text", maxLength: 320, span: 2 },
    { name: "percentOff", label: f.percentOff, type: "number", min: 1, max: 100, nullable: true },
    { name: "fixedOffMinor", label: f.fixedOffMinor, type: "number", money: true, min: 0, nullable: true },
    { name: "redemptionLimit", label: f.redemptionLimit, type: "number", min: 1, nullable: true },
    { name: "active", label: f.active, type: "checkbox", defaultValue: true },
    { name: "startsAt", label: f.startsAt, type: "date", nullable: true },
    { name: "expiresAt", label: f.expiresAt, type: "date", nullable: true },
  ];
}

export function usersFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "name", label: f.name, type: "text", required: true, maxLength: 120 },
    { name: "email", label: f.email, type: "text", required: true, maxLength: 255 },
    { name: "password", label: f.password, type: "password", required: true, createOnly: true, hint: f.passwordOptional },
    { name: "password", label: f.password, type: "password", editOnly: true, hint: f.passwordOptional, maxLength: 128 },
    { name: "phone", label: f.phone, type: "text", maxLength: 40 },
    { name: "locale", label: f.locale, type: "select", options: [{ value: "en", label: "English" }, { value: "fr", label: "Français" }, { value: "ar", label: "العربية" }], defaultValue: "en" },
    { name: "status", label: f.status, type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "SUSPENDED", label: "Suspended" }], defaultValue: "ACTIVE" },
    { name: "role", label: f.role, type: "select", createOnly: true, options: (["CUSTOMER", "GUIDE", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"] as const).map((v) => ({ value: v, label: t.admin.crud.roles[v] })), defaultValue: "CUSTOMER" },
  ];
}

export function customersFields(t: Dictionary): CrudField[] {
  const f = t.admin.fields;
  return [
    { name: "fullName", label: f.fullName, type: "text", required: true, maxLength: 160, span: 2 },
    { name: "phone", label: f.phone, type: "text", maxLength: 40 },
    { name: "city", label: f.city, type: "text", maxLength: 120 },
    { name: "country", label: f.country, type: "text", maxLength: 2, hint: "ISO 3166-1 alpha-2" },
    { name: "locale", label: f.locale, type: "select", options: [{ value: "en", label: "English" }, { value: "fr", label: "Français" }, { value: "ar", label: "العربية" }], defaultValue: "en" },
    { name: "notes", label: f.notes, type: "textarea", maxLength: 5000, rows: 4, span: 2 },
  ];
}
