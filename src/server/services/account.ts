import { prisma } from "@/lib/db/prisma";

export async function listUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { customer: { userId }, deletedAt: null },
    orderBy: { date: "desc" },
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
      currency: true,
      createdAt: true,
      experience: {
        select: {
          title: true,
          slug: true,
          cancelWindowHours: true,
          coverImage: { select: { path: true, alt: true } },
        },
      },
      tourDate: {
        select: {
          tour: {
            select: {
              title: true,
              coverImage: { select: { path: true, alt: true } },
            },
          },
        },
      },
    },
  });
}

export async function listUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { customer: { userId }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      status: true,
      createdAt: true,
      experience: { select: { title: true, slug: true } },
    },
  });
}

export async function listUserTripPlans(userId: string) {
  return prisma.tripPlan.findMany({
    where: { customer: { userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      shareSlug: true,
      days: true,
      style: true,
      totalMinor: true,
      currency: true,
      createdAt: true,
    },
  });
}

export async function getAccountStats(userId: string) {
  const now = new Date();
  const [bookings, upcoming, favorites, reviews] = await Promise.all([
    prisma.booking.count({ where: { customer: { userId }, deletedAt: null } }),
    prisma.booking.count({
      where: {
        customer: { userId },
        deletedAt: null,
        date: { gte: now },
        status: { in: ["PENDING", "CONFIRMED", "PAID"] },
      },
    }),
    prisma.favorite.count({ where: { userId } }),
    prisma.review.count({ where: { customer: { userId }, deletedAt: null } }),
  ]);
  return { bookings, upcoming, favorites, reviews };
}
