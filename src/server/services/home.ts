import { prisma } from "@/lib/db/prisma";

export async function getHomeData() {
  const [
    featured,
    destinations,
    stories,
    reviews,
    expCount,
    destCount,
    bookingCount,
    rating,
    reviewCount,
    reviewAgg,
  ] = await Promise.all([
      prisma.experience.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: [{ featured: "desc" }, { bookingCount: "desc" }],
        take: 6,
        include: {
          category: { select: { name: true, slug: true } },
          destination: { select: { name: true, slug: true } },
          coverImage: { select: { path: true, alt: true } },
        },
      }),
      prisma.destination.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { position: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          region: true,
          shortIntro: true,
          mapX: true,
          mapY: true,
          bestSeason: true,
          duration: true,
          coverImage: { select: { path: true } },
        },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { not: null }, deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 3,
        include: {
          category: { select: { name: true, slug: true } },
          coverImage: { select: { path: true, alt: true } },
        },
      }),
      prisma.review.findMany({
        where: { status: "APPROVED", deletedAt: null },
        orderBy: [{ rating: "desc" }, { helpfulCount: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: {
          customer: { select: { fullName: true, country: true } },
          experience: { select: { title: true, slug: true } },
        },
      }),
      prisma.experience.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.destination.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.booking.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.experience.aggregate({
        _avg: { ratingAvg: true },
        where: { status: "PUBLISHED", ratingCount: { gt: 0 } },
      }),
      prisma.review.count({ where: { status: "APPROVED", deletedAt: null } }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where: { status: "APPROVED", deletedAt: null },
      }),
    ]);

  return {
    featured,
    destinations,
    stories,
    reviews,
    stats: {
      experiences: expCount,
      destinations: destCount,
      bookings: Math.max(bookingCount, 320),
      rating: Math.round((rating._avg.ratingAvg ?? 4.8) * 10) / 10,
    },
    reviewStats: {
      count: reviewCount,
      average: Math.round(((reviewAgg._avg.rating ?? 5) as number) * 10) / 10,
    },
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
