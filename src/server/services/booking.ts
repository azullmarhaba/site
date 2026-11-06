import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "./users";
import { getSettings } from "./settings";
import { createCodPayment, refundPayment } from "./payments";
import { logAudit } from "./audit";
import { notify } from "./notifications";

const CHILD_PRICE_FACTOR = 0.5; // children (2–11) pay 50% — documented pricing rule

function utcDay(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return utcDay(iso) < today;
}

async function nextReference(): Promise<string> {
  const last = await prisma.booking.findFirst({
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });
  const match = last?.reference?.match(/(\d{6})$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `AZL-2027-${String(next).padStart(6, "0")}`;
}

async function resolveCoupon(code: string, subtotalMinor: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || coupon.active === false || coupon.deletedAt) {
    throw new ServiceError("COUPON_INVALID", 400);
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new ServiceError("COUPON_INVALID", 400);
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ServiceError("COUPON_EXPIRED", 400);
  if (
    coupon.redemptionLimit !== null &&
    coupon.redeemedCount >= coupon.redemptionLimit
  ) {
    throw new ServiceError("COUPON_EXHAUSTED", 400);
  }

  let discountMinor = 0;
  if (coupon.percentOff) {
    discountMinor = Math.round((subtotalMinor * coupon.percentOff) / 100);
  } else if (coupon.fixedOffMinor) {
    discountMinor = Math.min(coupon.fixedOffMinor, subtotalMinor);
  }
  return { coupon, discountMinor };
}

export type BookingInput = {
  experienceSlug: string;
  date: string;
  adults: number;
  children: number;
  mode: "PRIVATE" | "GROUP";
  pickupLocationId?: string;
  pickupAddress?: string;
  specialRequests?: string;
  couponCode?: string;
  leadFirstName: string;
  leadLastName: string;
  email: string;
  phone: string;
  tourDateId?: string;
  userId?: string;
  /** Cash on Delivery — the only settlement method offered. */
  paymentMethod?: "COD";
};

export async function createBooking(input: BookingInput) {
  const experience = await prisma.experience.findFirst({
    where: { slug: input.experienceSlug, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      priceMinor: true,
      currency: true,
      capacityMin: true,
      capacityMax: true,
      minBookingNoticeHours: true,
      cancelWindowHours: true,
    },
  });
  if (!experience) throw new ServiceError("EXPERIENCE_NOT_FOUND", 404);

  if (isPastDate(input.date)) throw new ServiceError("DATE_PAST", 400);

  const tourDate = input.tourDateId
    ? await prisma.tourDate.findFirst({
        where: {
          id: input.tourDateId,
          status: "PUBLISHED",
          date: { gte: utcDay(new Date().toISOString().slice(0, 10)) },
          tour: {
            status: "PUBLISHED",
            deletedAt: null,
            experience: { slug: input.experienceSlug },
          },
        },
        select: {
          id: true,
          date: true,
          capacityTotal: true,
          capacityBooked: true,
          tour: {
            select: {
              title: true,
              priceMinor: true,
              currency: true,
              capacity: true,
            },
          },
        },
      })
    : null;
  if (
    input.tourDateId &&
    (!tourDate || tourDate.date.getTime() !== utcDay(input.date).getTime())
  ) {
    throw new ServiceError("DEPARTURE_UNAVAILABLE", 400);
  }

  const noticeOk =
    Date.now() + experience.minBookingNoticeHours * 3600_000 <=
    utcDay(input.date).getTime() + 24 * 3600_000;
  if (!noticeOk) throw new ServiceError("NOTICE_TOO_SHORT", 400);

  const guests = input.adults + input.children;
  if (guests < experience.capacityMin || guests > experience.capacityMax) {
    throw new ServiceError("CAPACITY_RANGE", 400);
  }
  if (
    tourDate &&
    (guests > tourDate.tour.capacity || guests > tourDate.capacityTotal)
  ) {
    throw new ServiceError("CAPACITY_RANGE", 400);
  }

  // --- price (server-side only; never trust client totals) ---
  const priceMinor = tourDate?.tour.priceMinor ?? experience.priceMinor;
  const bookingTitle = tourDate?.tour.title ?? experience.title;
  const bookingCurrency = tourDate?.tour.currency ?? experience.currency;
  const adultTotal = input.adults * priceMinor;
  const childTotal = Math.round(input.children * priceMinor * CHILD_PRICE_FACTOR);
  const subtotalMinor = adultTotal + childTotal;
  let discountMinor = 0;
  let couponId: string | null = null;

  if (input.couponCode) {
    const resolved = await resolveCoupon(input.couponCode, subtotalMinor);
    discountMinor = resolved.discountMinor;
    couponId = resolved.coupon.id;
  }

  const settings = await getSettings();
  const taxable = Math.max(0, subtotalMinor - discountMinor);
  const taxMinor = Math.round((taxable * settings.taxRate) / 100);
  const totalMinor = taxable + taxMinor;

  // --- ensure customer (guest bookings auto-provision; logged-in users link) ---
  let userId = input.userId ?? null;
  if (!userId) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() } });
    if (existing) userId = existing.id;
  }

  let customer = userId
    ? await prisma.customer.findUnique({ where: { userId } })
    : null;

  if (!customer) {
    // Guest checkout: require a usable password? No — create a lightweight account
    // only when registering is requested. For guests we still need a Customer row.
    if (!userId) {
      // Create or reuse a customer-only record via a system guest user.
      const guestEmail = `guest+${input.email.toLowerCase().trim()}`;
      const guestUser = await prisma.user.upsert({
        where: { email: guestEmail },
        update: {},
        create: {
          email: guestEmail,
          name: `${input.leadFirstName} ${input.leadLastName}`.trim(),
          phone: input.phone,
          locale: "en",
          roles: { create: { role: { connect: { name: "CUSTOMER" } } } },
          customer: {
            create: {
              fullName: `${input.leadFirstName} ${input.leadLastName}`.trim(),
              phone: input.phone,
            },
          },
        },
        include: { customer: true },
      });
      customer = guestUser.customer;
    } else {
      const created = await prisma.customer.create({
        data: {
          userId,
          fullName: `${input.leadFirstName} ${input.leadLastName}`.trim(),
          phone: input.phone,
        },
      });
      customer = created;
    }
  }
  if (!customer) throw new ServiceError("CUSTOMER_FAILED", 500);

  // --- create booking (+ guest + payment) in one transaction ---
  const reference = await nextReference();
  const tourDateId = tourDate?.id ?? null;

  const booking = await prisma.$transaction(async (tx) => {
    if (tourDate) {
      if (tourDate.capacityTotal - tourDate.capacityBooked < guests) {
        throw new ServiceError("SOLD_OUT", 409);
      }
      const reserved = await tx.tourDate.updateMany({
        where: {
          id: tourDate.id,
          status: "PUBLISHED",
          date: { gte: utcDay(new Date().toISOString().slice(0, 10)) },
          capacityTotal: tourDate.capacityTotal,
          capacityBooked: { lte: tourDate.capacityTotal - guests },
        },
        data: { capacityBooked: { increment: guests } },
      });
      if (reserved.count === 0) throw new ServiceError("SOLD_OUT", 409);
    } else {
      const day = await tx.availability.findUnique({
        where: {
          experienceId_date: { experienceId: experience.id, date: utcDay(input.date) },
        },
      });
      if (!day || day.closed) throw new ServiceError("DATE_CLOSED", 400);
      if (day.capacityTotal - day.capacityBooked < guests) {
        throw new ServiceError("SOLD_OUT", 409);
      }
      const reserved = await tx.availability.updateMany({
        where: {
          id: day.id,
          capacityBooked: { lte: day.capacityTotal - guests },
        },
        data: { capacityBooked: { increment: guests } },
      });
      if (reserved.count === 0) throw new ServiceError("SOLD_OUT", 409);
    }

    const created = await tx.booking.create({
      data: {
        reference,
        customerId: customer!.id,
        experienceId: experience.id,
        tourDateId,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        mode: input.mode,
        date: utcDay(input.date),
        guests,
        adults: input.adults,
        children: input.children,
        pickupLocationId: input.pickupLocationId || null,
        pickupAddress: input.pickupAddress || null,
        specialRequests: input.specialRequests || null,
        couponId,
        subtotalMinor,
        discountMinor,
        taxMinor,
        totalMinor,
        currency: bookingCurrency,
        items: {
          create: [
            {
              label: `${bookingTitle} × ${input.adults} adult${input.adults > 1 ? "s" : ""}`,
              quantity: input.adults,
              unitPriceMinor: priceMinor,
              totalMinor: adultTotal,
            },
            ...(input.children > 0
              ? [
                  {
                    label: `${bookingTitle} × ${input.children} child${input.children > 1 ? "ren" : ""}`,
                    quantity: input.children,
                    unitPriceMinor: Math.round(priceMinor * CHILD_PRICE_FACTOR),
                    totalMinor: childTotal,
                  },
                ]
              : []),
          ],
        },
        guests2: {
          create: {
            firstName: input.leadFirstName,
            lastName: input.leadLastName,
            isLead: true,
            ageGroup: "ADULT",
          },
        },
      },
      include: { experience: { select: { title: true } } },
    });

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { redeemedCount: { increment: 1 } },
      });
    }

    // Cash on Delivery: reserve the pending cash payment now; the guide
    // collects the amount on the day and staff settle it later.
    await createCodPayment(tx, {
      bookingId: created.id,
      amountMinor: totalMinor,
      currency: bookingCurrency,
    });
    await tx.experience.update({
      where: { id: experience.id },
      data: { bookingCount: { increment: 1 } },
    });

    return created;
  });

  // --- side effects (best-effort) ---
  if (userId) {
    await notify(
      userId,
      "BOOKING_CONFIRMED",
      "Booking confirmed",
      `${bookingTitle} — ${input.date} · ${reference} · pay on arrival`
    );
  }
  await logAudit({
    actorId: userId,
    action: "booking.create",
    entity: "Booking",
    entityId: booking.id,
    diff: { reference, totalMinor, status: booking.status },
  });

  return booking;
}

export async function getBookingByReference(reference: string) {
  return prisma.booking.findUnique({
    where: { reference },
    include: {
      experience: {
        select: {
          title: true,
          slug: true,
          meetingPoint: true,
          cancelWindowHours: true,
          coverImage: { select: { path: true, alt: true } },
        },
      },
      pickupLocation: { select: { name: true, address: true } },
      payments: { select: { status: true, amountMinor: true, currency: true, paidAt: true, provider: true } },
      customer: { select: { fullName: true, phone: true, user: { select: { email: true } } } },
      guide: { include: { user: { select: { name: true } } } },
      tourDate: {
        select: {
          date: true,
          startTime: true,
          tour: {
            select: {
              title: true,
              coverImage: { select: { path: true, alt: true } },
            },
          },
        },
      },
      coupon: { select: { code: true, percentOff: true, fixedOffMinor: true } },
    },
  });
}

export async function cancelBooking(reference: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      experience: { select: { cancelWindowHours: true, title: true } },
      tourDate: { select: { tour: { select: { title: true } } } },
    },
  });
  if (!booking) throw new ServiceError("NOT_FOUND", 404);

  const customer = await prisma.customer.findUnique({ where: { id: booking.customerId } });
  const owner = customer?.userId === userId;
  const staff = false; // caller performs role checks upstream
  if (!owner && !staff) throw new ServiceError("FORBIDDEN", 403);

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    throw new ServiceError("NOT_CANCELLABLE", 400);
  }

  const start = booking.date.getTime();
  const deadline = start - booking.experience.cancelWindowHours * 3600_000;
  if (Date.now() > deadline) throw new ServiceError("CANCEL_WINDOW_PASSED", 403);

  await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.updateMany({
      where: { id: booking.id, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "customer" },
    });
    if (cancelled.count === 0) throw new ServiceError("NOT_CANCELLABLE", 400);
    if (booking.tourDateId) {
      await tx.tourDate.update({
        where: { id: booking.tourDateId },
        data: { capacityBooked: { decrement: booking.guests } },
      });
    } else {
      await tx.availability.updateMany({
        where: {
          experienceId: booking.experienceId,
          date: booking.date,
        },
        data: { capacityBooked: { decrement: booking.guests } },
      });
    }
    await refundPayment(booking.id);
  });

  await notify(
    userId,
    "BOOKING_CANCELLED",
    "Booking cancelled",
    `${booking.tourDate?.tour.title ?? booking.experience.title} — ${reference}`,
  );
  await logAudit({ actorId: userId, action: "booking.cancel", entity: "Booking", entityId: booking.id });

  return { reference };
}

export { ServiceError };
