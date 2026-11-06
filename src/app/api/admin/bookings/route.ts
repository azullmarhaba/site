import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { logAudit } from "@/server/services/audit";
import { adminUpdateBooking } from "@/server/services/admin";
import { createBooking } from "@/server/services/booking";
import { ServiceError } from "@/server/services/users";
import { bookingSchema } from "@/lib/validation";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["CONFIRMED", "CANCELLED", "REFUNDED", "COMPLETED", "PAID"]).optional(),
  internalNotes: z.string().max(2000).optional(),
  guideId: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where = {
    deletedAt: null,
    ...(status ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q } },
            { customer: { fullName: { contains: q } } },
            { customer: { user: { email: { contains: q } } } },
            { experience: { title: { contains: q } } },
          ],
        }
      : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        reference: true,
        status: true,
        mode: true,
        date: true,
        guests: true,
        totalMinor: true,
        discountMinor: true,
        currency: true,
        internalNotes: true,
        createdAt: true,
        customer: { select: { id: true, fullName: true, phone: true, user: { select: { email: true } } } },
        experience: { select: { id: true, title: true, slug: true } },
        pickupLocation: { select: { name: true } },
        guide: { select: { id: true, user: { select: { name: true } } } },
        vehicle: { select: { id: true, make: true, model: true } },
        payments: { select: { status: true, amountMinor: true, provider: true, paidAt: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return jsonOk({ bookings, total, page, pageSize });
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const parsed = await parseBody(request, bookingSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const booking = await createBooking({
      ...parsed.data,
      pickupLocationId: parsed.data.pickupLocationId || undefined,
      pickupAddress: parsed.data.pickupAddress || undefined,
      specialRequests: parsed.data.specialRequests || undefined,
      couponCode: parsed.data.couponCode || undefined,
      tourDateId: parsed.data.tourDateId || undefined,
    });
    await logAudit({
      actorId: user.id,
      action: "booking.create_admin",
      entity: "Booking",
      entityId: booking.id,
      diff: { reference: booking.reference },
    });
    return jsonOk({ reference: booking.reference, status: booking.status }, 201);
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[admin booking create]", err);
    return jsonError("Booking failed", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  const parsed = await parseBody(request, bodySchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  try {
    const booking = await adminUpdateBooking({
      bookingId: parsed.data.bookingId,
      actorId: user.id,
      status: parsed.data.status,
      internalNotes: parsed.data.internalNotes,
      guideId: parsed.data.guideId,
      vehicleId: parsed.data.vehicleId,
    });
    return jsonOk({ id: booking.id, status: booking.status });
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[admin booking]", err);
    return jsonError("Update failed", 500);
  }
}
