import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "./users";
import { logAudit } from "./audit";

export async function submitReview(input: {
  userId: string;
  experienceSlug: string;
  bookingReference: string;
  rating: number;
  title?: string;
  body: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { reference: input.bookingReference },
    include: {
      experience: { select: { id: true, slug: true, title: true } },
      customer: { select: { id: true, userId: true } },
    },
  });
  if (!booking) throw new ServiceError("BOOKING_NOT_FOUND", 404);
  if (booking.customer.userId !== input.userId) throw new ServiceError("FORBIDDEN", 403);
  if (booking.experience.slug !== input.experienceSlug) {
    throw new ServiceError("MISMATCH", 400);
  }
  if (!["COMPLETED", "PAID", "IN_PROGRESS"].includes(booking.status)) {
    throw new ServiceError("NOT_REVIEWABLE", 400);
  }

  const existing = await prisma.review.findUnique({
    where: { bookingId: booking.id },
  });
  if (existing) throw new ServiceError("ALREADY_REVIEWED", 409);

  const review = await prisma.review.create({
    data: {
      customerId: booking.customer.id,
      experienceId: booking.experience.id,
      bookingId: booking.id,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      status: "PENDING",
    },
  });

  await logAudit({
    actorId: input.userId,
    action: "review.create",
    entity: "Review",
    entityId: review.id,
  });

  return review;
}

async function recomputeExperienceRating(experienceId: string) {
  const agg = await prisma.review.aggregate({
    where: { experienceId, status: "APPROVED", deletedAt: null },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.experience.update({
    where: { id: experienceId },
    data: {
      ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)),
      ratingCount: agg._count,
    },
  });
}

export async function moderateReview(input: {
  reviewId: string;
  status: "APPROVED" | "REJECTED";
  moderatorId: string;
}) {
  const review = await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      status: input.status,
      moderatedBy: input.moderatorId,
      moderatedAt: new Date(),
    },
  });
  await recomputeExperienceRating(review.experienceId);
  await logAudit({
    actorId: input.moderatorId,
    action: `review.${input.status.toLowerCase()}`,
    entity: "Review",
    entityId: review.id,
  });
  return review;
}

export async function listApprovedReviews(experienceId: string, limit = 8) {
  return prisma.review.findMany({
    where: { experienceId, status: "APPROVED", deletedAt: null },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      customer: { select: { fullName: true, country: true } },
    },
  });
}

export { ServiceError };
