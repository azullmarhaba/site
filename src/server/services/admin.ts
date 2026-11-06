import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "./users";
import { refundPayment, settleCodPayment } from "./payments";
import { logAudit } from "./audit";
import { notify } from "./notifications";

// ------------------------------------------------------------
// Overview stats
// ------------------------------------------------------------

export async function getAdminStats() {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [
    paidAgg,
    totalBookings,
    pendingBookings,
    customers,
    upcomingTours,
    confirmed,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountMinor: true },
    }),
    prisma.booking.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.tourDate.count({
      where: { date: { gte: new Date() }, status: "PUBLISHED" },
    }),
    prisma.booking.count({
      where: { status: { in: ["CONFIRMED", "PAID", "IN_PROGRESS", "COMPLETED"] }, deletedAt: null },
    }),
  ]);

  const conversion = totalBookings > 0 ? Math.round((confirmed / totalBookings) * 100) : 0;

  return {
    revenueMinor: paidAgg._sum.amountMinor ?? 0,
    totalBookings,
    pendingBookings,
    customers,
    upcomingTours,
    conversion,
    startOfMonth,
  };
}

export async function listRecentBookings(limit = 8) {
  return prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      status: true,
      date: true,
      guests: true,
      totalMinor: true,
      currency: true,
      createdAt: true,
      customer: { select: { fullName: true, user: { select: { email: true } } } },
      experience: { select: { title: true, slug: true } },
    },
  });
}

export async function listPopularExperiences(limit = 5) {
  return prisma.experience.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { bookingCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      bookingCount: true,
      ratingAvg: true,
      ratingCount: true,
      priceMinor: true,
    },
  });
}

// ------------------------------------------------------------
// Booking management
// ------------------------------------------------------------

export async function adminUpdateBooking(input: {
  bookingId: string;
  actorId: string;
  status?: "CONFIRMED" | "CANCELLED" | "REFUNDED" | "COMPLETED" | "PAID";
  internalNotes?: string;
  guideId?: string;
  vehicleId?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      reference: true,
      status: true,
      customerId: true,
      guests: true,
      tourDateId: true,
      experienceId: true,
      date: true,
      experience: { select: { title: true } },
      tourDate: { select: { tour: { select: { title: true } } } },
    },
  });
  if (!booking) throw new ServiceError("NOT_FOUND", 404);

  const data: Record<string, unknown> = {};
  if (input.internalNotes !== undefined) data.internalNotes = input.internalNotes;
  if (input.guideId !== undefined) data.guideId = input.guideId || null;
  if (input.vehicleId !== undefined) data.vehicleId = input.vehicleId || null;

  if (input.status && input.status !== booking.status) {
    data.status = input.status;
    if (input.status === "CONFIRMED") data.confirmedAt = new Date();
    if (input.status === "COMPLETED") data.completedAt = new Date();
    if (input.status === "CANCELLED") data.cancelledAt = new Date();
  }

  const updated =
    input.status === "CANCELLED" && booking.status !== "CANCELLED"
      ? await prisma.$transaction(async (tx) => {
          const cancelled = await tx.booking.updateMany({
            where: { id: booking.id, status: booking.status },
            data,
          });
          if (cancelled.count === 0) {
            throw new ServiceError("BOOKING_CHANGED", 409);
          }

          const released = booking.tourDateId
            ? await tx.tourDate.updateMany({
                where: {
                  id: booking.tourDateId,
                  capacityBooked: { gte: booking.guests },
                },
                data: { capacityBooked: { decrement: booking.guests } },
              })
            : await tx.availability.updateMany({
                where: {
                  experienceId: booking.experienceId,
                  date: booking.date,
                  capacityBooked: { gte: booking.guests },
                },
                data: { capacityBooked: { decrement: booking.guests } },
              });
          if (released.count === 0) {
            throw new ServiceError("CAPACITY_RELEASE_FAILED", 500);
          }

          return tx.booking.findUniqueOrThrow({
            where: { id: booking.id },
            include: { customer: { select: { userId: true } } },
          });
        })
      : await prisma.booking.update({
          where: { id: booking.id },
          data,
          include: { customer: { select: { userId: true } } },
        });

  if (input.status === "REFUNDED" && booking.status !== "REFUNDED") {
    await refundPayment(booking.id);
  }

  // Cash on Delivery collected — mark the outstanding cash payment as paid.
  if (input.status === "PAID" && booking.status !== "PAID") {
    await settleCodPayment(booking.id);
  }

  if (updated.customer.userId && input.status) {
    const titles: Record<string, string> = {
      CONFIRMED: "Booking confirmed",
      PAID: "Payment received",
      CANCELLED: "Booking cancelled",
      REFUNDED: "Booking refunded",
      COMPLETED: "Journey completed",
    };
    const types = {
      CONFIRMED: "BOOKING_CONFIRMED",
      PAID: "PAYMENT_RECEIVED",
      CANCELLED: "BOOKING_CANCELLED",
      REFUNDED: "BOOKING_CANCELLED",
      COMPLETED: "BOOKING_CONFIRMED",
    } as const;
    if (titles[input.status]) {
      await notify(
        updated.customer.userId,
        types[input.status],
        titles[input.status],
        `${booking.tourDate?.tour.title ?? booking.experience.title} — ${booking.reference}`
      );
    }
  }

  await logAudit({
    actorId: input.actorId,
    action: "booking.update",
    entity: "Booking",
    entityId: booking.id,
    diff: { status: input.status, guideId: input.guideId, vehicleId: input.vehicleId },
  });

  return updated;
}

// ------------------------------------------------------------
// Catalog management
// ------------------------------------------------------------

export async function adminSetExperienceStatus(input: {
  experienceId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  actorId: string;
}) {
  const updated = await prisma.experience.update({
    where: { id: input.experienceId },
    data: { status: input.status },
    select: { id: true, status: true },
  });
  await logAudit({
    actorId: input.actorId,
    action: "experience.status",
    entity: "Experience",
    entityId: updated.id,
    diff: { status: input.status },
  });
  return updated;
}

export async function adminUpdateExperience(input: {
  experienceId: string;
  actorId: string;
  title?: string;
  summary?: string;
  description?: string;
  priceMinor?: number;
  capacityMin?: number;
  capacityMax?: number;
  featured?: boolean;
  meetingPoint?: string;
  cancelWindowHours?: number;
  coverImageId?: string | null;
  galleryMediaIds?: string[];
}) {
  const galleryMediaIds =
    input.galleryMediaIds !== undefined ? [...new Set(input.galleryMediaIds)] : undefined;
  const mediaIds = [
    ...(input.coverImageId ? [input.coverImageId] : []),
    ...(galleryMediaIds ?? []),
  ];

  const updated = await prisma.$transaction(async (tx) => {
    if (mediaIds.length) {
      const activeMedia = await tx.media.findMany({
        where: { id: { in: mediaIds }, deletedAt: null },
        select: { id: true },
      });
      if (activeMedia.length !== new Set(mediaIds).size) {
        throw new ServiceError("MEDIA_NOT_FOUND", 400);
      }
    }

    const experience = await tx.experience.update({
      where: { id: input.experienceId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
        ...(input.capacityMin !== undefined ? { capacityMin: input.capacityMin } : {}),
        ...(input.capacityMax !== undefined ? { capacityMax: input.capacityMax } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.meetingPoint !== undefined ? { meetingPoint: input.meetingPoint } : {}),
        ...(input.cancelWindowHours !== undefined ? { cancelWindowHours: input.cancelWindowHours } : {}),
        ...(input.coverImageId !== undefined ? { coverImageId: input.coverImageId || null } : {}),
      },
      select: { id: true },
    });
    if (galleryMediaIds !== undefined) {
      await tx.gallery.deleteMany({ where: { experienceId: input.experienceId } });
      if (galleryMediaIds.length) {
        await tx.gallery.createMany({
          data: galleryMediaIds.map((mediaId, position) => ({
            experienceId: input.experienceId,
            mediaId,
            position,
          })),
        });
      }
    }
    return experience;
  });
  await logAudit({
    actorId: input.actorId,
    action: "experience.update",
    entity: "Experience",
    entityId: updated.id,
    diff: input as object,
  });
  return updated;
}

// ------------------------------------------------------------
// Messages
// ------------------------------------------------------------

export async function adminSetMessageStatus(input: {
  messageId: string;
  status: "IN_PROGRESS" | "RESOLVED";
  actorId: string;
}) {
  const updated = await prisma.contactMessage.update({
    where: { id: input.messageId },
    data: {
      status: input.status,
      ...(input.status === "RESOLVED" ? { repliedAt: new Date() } : {}),
    },
    select: { id: true, status: true },
  });
  await logAudit({
    actorId: input.actorId,
    action: "message.status",
    entity: "ContactMessage",
    entityId: updated.id,
    diff: { status: input.status },
  });
  return updated;
}

// ------------------------------------------------------------
// Coupons
// ------------------------------------------------------------

export async function adminCreateCoupon(input: {
  code: string;
  description?: string;
  percentOff?: number;
  fixedOffMinor?: number;
  redemptionLimit?: number;
  expiresAt?: Date;
  actorId: string;
}) {
  const coupon = await prisma.coupon.create({
    data: {
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      percentOff: input.percentOff ?? null,
      fixedOffMinor: input.fixedOffMinor ?? null,
      redemptionLimit: input.redemptionLimit ?? null,
      expiresAt: input.expiresAt ?? null,
    },
    select: { id: true, code: true },
  });
  await logAudit({
    actorId: input.actorId,
    action: "coupon.create",
    entity: "Coupon",
    entityId: coupon.id,
    diff: { code: coupon.code },
  });
  return coupon;
}

// ------------------------------------------------------------
// Users
// ------------------------------------------------------------

export async function adminSetUserRole(input: {
  userId: string;
  role: string;
  actorId: string;
}) {
  const role = await prisma.role.findUnique({ where: { name: input.role as never } });
  if (!role) throw new ServiceError("ROLE_INVALID", 400);
  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: input.userId, roleId: role.id } },
  });
  if (existing) {
    await prisma.userRole.delete({
      where: { userId_roleId: { userId: input.userId, roleId: role.id } },
    });
  } else {
    await prisma.userRole.create({
      data: { userId: input.userId, roleId: role.id },
    });
  }
  await logAudit({
    actorId: input.actorId,
    action: existing ? "user.role_remove" : "user.role_add",
    entity: "User",
    entityId: input.userId,
    diff: { role: input.role },
  });
  return { active: !existing };
}

// ------------------------------------------------------------
// Admin list views
// ------------------------------------------------------------

export async function listAdminBookings(opts: { status?: string; q?: string; page?: number } = {}) {
  const pageSize = 20;
  const page = Math.max(1, opts.page ?? 1);
  const where = {
    deletedAt: null,
    ...(opts.status ? { status: opts.status as never } : {}),
    ...(opts.q
      ? {
          OR: [
            { reference: { contains: opts.q } },
            { customer: { fullName: { contains: opts.q } } },
            { customer: { user: { email: { contains: opts.q } } } },
            { experience: { title: { contains: opts.q } } },
            { tourDate: { tour: { title: { contains: opts.q } } } },
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
        confirmedAt: true,
        cancelledAt: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            country: true,
            user: { select: { id: true, email: true } },
          },
        },
        experience: { select: { id: true, title: true, slug: true } },
        tourDate: { select: { tour: { select: { title: true, slug: true } } } },
        pickupLocation: { select: { id: true, name: true, address: true } },
        guide: { select: { id: true, user: { select: { name: true } } } },
        vehicle: { select: { id: true, make: true, model: true, plate: true } },
        payments: {
          select: { id: true, status: true, amountMinor: true, provider: true, paidAt: true },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, pageSize };
}

export async function listAdminExperiences() {
  return prisma.experience.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      status: true,
      featured: true,
      priceMinor: true,
      currency: true,
      durationMinutes: true,
      capacityMin: true,
      capacityMax: true,
      meetingPoint: true,
      cancelWindowHours: true,
      ratingAvg: true,
      ratingCount: true,
      bookingCount: true,
      description: true,
      category: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
      coverImage: { select: { id: true, path: true, filename: true, alt: true, mimeType: true } },
      coverImageId: true,
      gallery: {
        where: { media: { deletedAt: null } },
        orderBy: { position: "asc" },
        select: {
          mediaId: true,
          media: { select: { id: true, path: true, filename: true, alt: true, mimeType: true } },
        },
      },
    },
  });
}

export async function listAdminReviews(status?: string) {
  return prisma.review.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      status: true,
      createdAt: true,
      moderatedAt: true,
      customer: { select: { fullName: true, user: { select: { email: true } } } },
      experience: { select: { title: true, slug: true } },
    },
  });
}

export async function listAdminMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
      locale: true,
      status: true,
      repliedAt: true,
      createdAt: true,
    },
  });
}

export async function listAdminCoupons() {
  return prisma.coupon.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      description: true,
      percentOff: true,
      fixedOffMinor: true,
      currency: true,
      redemptionLimit: true,
      redeemedCount: true,
      expiresAt: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      roles: { select: { role: { select: { name: true } } } },
      customer: { select: { id: true } },
    },
  });
}

export async function listAdminAuditLogs(limit = 80) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      diff: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });
}

export async function listAdminCustomers() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      country: true,
      city: true,
      locale: true,
      notes: true,
      createdAt: true,
      user: { select: { id: true, email: true, status: true } },
      bookings: {
        where: { deletedAt: null },
        select: { id: true, totalMinor: true, status: true, date: true },
      },
      reviews: { where: { deletedAt: null }, select: { id: true } },
    },
  });
  return customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    country: c.country,
    city: c.city,
    locale: c.locale,
    notes: c.notes,
    createdAt: c.createdAt,
    email: c.user.email,
    userId: c.user.id,
    userStatus: c.user.status,
    bookingCount: c.bookings.length,
    spentMinor: c.bookings
      .filter((b) => ["PAID", "COMPLETED", "CONFIRMED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalMinor, 0),
    reviewCount: c.reviews.length,
    lastBookingAt: c.bookings.reduce<Date | null>(
      (latest, b) => (!latest || b.date > latest ? b.date : latest),
      null
    ),
  }));
}

export async function listAdminGuides() {
  const guides = await prisma.guide.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      bio: true,
      languages: true,
      yearsExp: true,
      licenseNumber: true,
      active: true,
      ratingAvg: true,
      user: { select: { id: true, name: true, email: true } },
      vehicles: { where: { deletedAt: null }, select: { id: true, make: true, model: true } },
      bookings: { select: { id: true }, take: 100 },
    },
  });
  return guides.map((g) => ({
    id: g.id,
    name: g.user.name,
    email: g.user.email,
    userId: g.user.id,
    languages: g.languages,
    yearsExp: g.yearsExp,
    licenseNumber: g.licenseNumber,
    active: g.active,
    ratingAvg: g.ratingAvg,
    vehicleCount: g.vehicles.length,
    bookingCount: g.bookings.length,
    bio: g.bio,
  }));
}

export async function listAdminVehicles() {
  return prisma.vehicle.findMany({
    where: { deletedAt: null },
    orderBy: [{ active: "desc" }, { make: "asc" }],
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      plate: true,
      seats: true,
      active: true,
      category: { select: { name: true } },
      guide: { select: { id: true, user: { select: { name: true } } } },
      bookings: { select: { id: true }, take: 50 },
    },
  });
}

export async function listAdminDestinations() {
  return prisma.destination.findMany({
    where: { deletedAt: null },
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      region: true,
      country: true,
      status: true,
      featured: true,
      bestSeason: true,
      experiences: { where: { deletedAt: null }, select: { id: true } },
      tours: { where: { deletedAt: null }, select: { id: true } },
      coverImage: { select: { path: true, alt: true } },
    },
  });
}

export async function listAdminTours() {
  return prisma.tour.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      priceMinor: true,
      currency: true,
      capacity: true,
      destination: { select: { name: true } },
      experience: { select: { title: true, slug: true } },
      dates: {
        orderBy: { date: "asc" },
        select: { id: true, date: true, capacityTotal: true, capacityBooked: true, status: true },
      },
    },
  });
}

export async function listAdminCategories() {
  return prisma.experienceCategory.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      experiences: { where: { deletedAt: null }, select: { id: true, status: true, bookingCount: true } },
    },
  });
}

export async function listAdminAvailability(
  opts: { from?: string; to?: string } = {}
) {
  const gte = opts.from ? new Date(`${opts.from}T00:00:00.000Z`) : undefined;
  const lte = opts.to ? new Date(`${opts.to}T23:59:59.999Z`) : undefined;
  return prisma.availability.findMany({
    where:
      gte || lte
        ? {
            date: {
              ...(gte ? { gte } : {}),
              ...(lte ? { lte } : {}),
            },
          }
        : undefined,
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      capacityTotal: true,
      capacityBooked: true,
      closed: true,
      experience: { select: { title: true, slug: true } },
    },
  });
}

export async function listAdminExperienceAvailability(experienceId: string) {
  return prisma.availability.findMany({
    where: { experienceId },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      capacityTotal: true,
      capacityBooked: true,
      closed: true,
    },
  });
}

export async function listAdminPayments(limit = 60) {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      providerRef: true,
      status: true,
      provider: true,
      amountMinor: true,
      refundedMinor: true,
      currency: true,
      createdAt: true,
      paidAt: true,
      booking: { select: { reference: true, customer: { select: { fullName: true } } } },
    },
  });
}

export async function listAdminPickupLocations() {
  return prisma.pickupLocation.findMany({
    where: { deletedAt: null },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      position: true,
      active: true,
      latitude: true,
      longitude: true,
    },
  });
}

export async function listAdminFaqs(limit = 80) {
  return prisma.faq.findMany({
    orderBy: { position: "asc" },
    take: limit,
    select: {
      id: true,
      question: true,
      answer: true,
      position: true,
      active: true,
      category: true,
      experience: { select: { title: true } },
    },
  });
}

export async function listAdminMedia(limit = 60) {
  return prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      filename: true,
      path: true,
      mimeType: true,
      sizeBytes: true,
      alt: true,
      caption: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });
}

export async function listAdminVehicleCategories() {
  return prisma.vehicleCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listAdminBlogCategories() {
  return prisma.blogCategory.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listAdminPosts() {
  return prisma.blogPost.findMany({
    where: { deletedAt: null },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      status: true,
      readingMinutes: true,
      publishedAt: true,
      authorName: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  });
}

export async function listAdminNotifications(limit = 60) {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      readAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function listAdminRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      users: { select: { userId: true } },
      permissions: {
        select: { permission: { select: { id: true, key: true } } },
      },
    },
  });
}

export async function listAdminPermissions() {
  return prisma.permission.findMany({
    orderBy: { key: "asc" },
    select: {
      id: true,
      key: true,
      description: true,
      roles: { select: { roleId: true } },
    },
  });
}

export async function adminSetPostStatus(input: {
  postId: string;
  status: "DRAFT" | "PUBLISHED";
  actorId: string;
}) {
  const updated = await prisma.blogPost.update({
    where: { id: input.postId },
    data: {
      status: input.status,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    select: { id: true, status: true },
  });
  await logAudit({
    actorId: input.actorId,
    action: "post.status",
    entity: "BlogPost",
    entityId: updated.id,
    diff: { status: input.status },
  });
  return updated;
}

export async function getAdminBooking(id: string) {
  return prisma.booking.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      reference: true,
      status: true,
      mode: true,
      date: true,
      guests: true,
      adults: true,
      children: true,
      totalMinor: true,
      discountMinor: true,
      subtotalMinor: true,
      taxMinor: true,
      currency: true,
      internalNotes: true,
      specialRequests: true,
      pickupAddress: true,
      confirmedAt: true,
      cancelledAt: true,
      createdAt: true,
      coupon: { select: { code: true } },
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          country: true,
          city: true,
          user: { select: { id: true, email: true, status: true } },
        },
      },
      experience: { select: { id: true, title: true, slug: true, meetingPoint: true } },
      tourDate: {
        select: {
          date: true,
          startTime: true,
          tour: { select: { title: true, slug: true } },
        },
      },
      pickupLocation: { select: { id: true, name: true, address: true } },
      guide: { select: { id: true, user: { select: { name: true } } } },
      vehicle: { select: { id: true, make: true, model: true, plate: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          providerRef: true,
          status: true,
          provider: true,
          amountMinor: true,
          refundedMinor: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getAdminExperience(id: string) {
  return prisma.experience.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      status: true,
      featured: true,
      priceMinor: true,
      currency: true,
      durationMinutes: true,
      capacityMin: true,
      capacityMax: true,
      meetingPoint: true,
      cancelWindowHours: true,
      minBookingNoticeHours: true,
      pickupIncluded: true,
      difficulty: true,
      ratingAvg: true,
      ratingCount: true,
      bookingCount: true,
      category: { select: { name: true, slug: true } },
      destination: { select: { name: true, slug: true } },
      coverImage: { select: { id: true, path: true, filename: true, alt: true, mimeType: true } },
      coverImageId: true,
      gallery: {
        where: { media: { deletedAt: null } },
        orderBy: { position: "asc" },
        select: {
          mediaId: true,
          media: { select: { id: true, path: true, filename: true, alt: true, mimeType: true } },
        },
      },
    },
  });
}
