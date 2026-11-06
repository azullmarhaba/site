import { prisma } from "@/lib/db/prisma";

export const experienceCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  priceMinor: true,
  currency: true,
  durationMinutes: true,
  difficulty: true,
  capacityMin: true,
  capacityMax: true,
  ratingAvg: true,
  ratingCount: true,
  bookingCount: true,
  featured: true,
  category: { select: { name: true, slug: true } },
  destination: { select: { name: true, slug: true } },
  coverImage: { select: { path: true, alt: true } },
} as const;

export type ExperienceCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  priceMinor: number;
  currency: string;
  durationMinutes: number;
  difficulty: string;
  capacityMin: number;
  capacityMax: number;
  ratingAvg: number;
  ratingCount: number;
  bookingCount: number;
  featured: boolean;
  category: { name: string; slug: string };
  destination: { name: string; slug: string };
  coverImage: { path: string; alt: string | null } | null;
};

function startOfUtcDay(offsetDays = 0): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

// ------------------------------------------------------------
// Destinations
// ------------------------------------------------------------

export async function listDestinations() {
  return prisma.destination.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      region: true,
      shortIntro: true,
      bestSeason: true,
      duration: true,
      mapX: true,
      mapY: true,
      coverImage: { select: { path: true, alt: true } },
      _count: {
        select: {
          experiences: { where: { status: "PUBLISHED", deletedAt: null } },
        },
      },
    },
  });
}

export type DestinationCardData = Awaited<ReturnType<typeof listDestinations>>[number];

export async function getDestination(slug: string) {
  const destination = await prisma.destination.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      region: true,
      description: true,
      shortIntro: true,
      bestSeason: true,
      duration: true,
      seoTitle: true,
      seoDescription: true,
      coverImage: { select: { path: true, alt: true } },
      _count: {
        select: {
          experiences: { where: { status: "PUBLISHED", deletedAt: null } },
        },
      },
    },
  });
  if (!destination) return null;

  const [experiences, tours, gallery] = await Promise.all([
    prisma.experience.findMany({
      where: { destinationId: destination.id, status: "PUBLISHED", deletedAt: null },
      orderBy: [{ featured: "desc" }, { bookingCount: "desc" }],
      take: 12,
      select: experienceCardSelect,
    }),
    prisma.tour.findMany({
      where: { destinationId: destination.id, status: "PUBLISHED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        priceMinor: true,
        capacity: true,
        coverImage: { select: { path: true, alt: true } },
        dates: {
          where: { date: { gte: startOfUtcDay(1) }, status: "PUBLISHED" },
          orderBy: { date: "asc" },
          take: 1,
          select: { date: true, capacityTotal: true, capacityBooked: true },
        },
      },
    }),
    prisma.gallery.findMany({
      where: { destinationId: destination.id },
      orderBy: { position: "asc" },
      take: 8,
      select: { media: { select: { path: true, alt: true } } },
    }),
  ]);

  return { destination, experiences, tours, gallery };
}

// ------------------------------------------------------------
// Categories & experience listing
// ------------------------------------------------------------

export async function listCategories() {
  return prisma.experienceCategory.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          experiences: { where: { status: "PUBLISHED", deletedAt: null } },
        },
      },
    },
  });
}

export type ExperienceSort = "featured" | "priceAsc" | "priceDesc" | "rating";

export async function listExperiences(opts: {
  category?: string;
  destination?: string;
  sort?: ExperienceSort;
}) {
  const orderBy =
    opts.sort === "priceAsc"
      ? { priceMinor: "asc" as const }
      : opts.sort === "priceDesc"
        ? { priceMinor: "desc" as const }
        : opts.sort === "rating"
          ? { ratingAvg: "desc" as const }
          : [{ featured: "desc" as const }, { bookingCount: "desc" as const }];

  const [experiences, total] = await Promise.all([
    prisma.experience.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(opts.category ? { category: { slug: opts.category } } : {}),
        ...(opts.destination ? { destination: { slug: opts.destination } } : {}),
      },
      orderBy,
      take: 60,
      select: experienceCardSelect,
    }),
    prisma.experience.count({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(opts.category ? { category: { slug: opts.category } } : {}),
        ...(opts.destination ? { destination: { slug: opts.destination } } : {}),
      },
    }),
  ]);

  return { experiences, total };
}

// ------------------------------------------------------------
// Experience detail
// ------------------------------------------------------------

export async function getExperience(slug: string) {
  const experience = await prisma.experience.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      durationMinutes: true,
      priceMinor: true,
      currency: true,
      capacityMin: true,
      capacityMax: true,
      difficulty: true,
      featured: true,
      meetingPoint: true,
      pickupIncluded: true,
      pickupNotes: true,
      highlights: true,
      includes: true,
      excludes: true,
      itinerary: true,
      cancelWindowHours: true,
      minBookingNoticeHours: true,
      ratingAvg: true,
      ratingCount: true,
      bookingCount: true,
      seoTitle: true,
      seoDescription: true,
      category: { select: { name: true, slug: true } },
      destination: { select: { id: true, name: true, slug: true, region: true } },
      coverImage: { select: { path: true, alt: true } },
      gallery: {
        orderBy: { position: "asc" },
        take: 10,
        select: { media: { select: { path: true, alt: true } } },
      },
      faqs: {
        where: { active: true },
        orderBy: { position: "asc" },
        select: { id: true, question: true, answer: true },
      },
    },
  });
  if (!experience) return null;

  const [availability, reviews, related] = await Promise.all([
    prisma.availability.findMany({
      where: {
        experienceId: experience.id,
        date: { gte: startOfUtcDay(1), lte: startOfUtcDay(120) },
      },
      orderBy: { date: "asc" },
      select: { date: true, capacityTotal: true, capacityBooked: true, closed: true },
    }),
    prisma.review.findMany({
      where: { experienceId: experience.id, status: "APPROVED", deletedAt: null },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        customer: { select: { fullName: true, country: true } },
      },
    }),
    prisma.experience.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        slug: { not: experience.slug },
        destinationId: experience.destination.id,
      },
      orderBy: { bookingCount: "desc" },
      take: 3,
      select: experienceCardSelect,
    }),
  ]);

  return { experience, availability, reviews, related };
}

// ------------------------------------------------------------
// Tours
// ------------------------------------------------------------

export async function listTours() {
  const tours = await prisma.tour.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceMinor: true,
      currency: true,
      capacity: true,
      coverImage: { select: { path: true, alt: true } },
      experience: {
        select: { slug: true, durationMinutes: true, title: true, capacityMin: true },
      },
      destination: { select: { name: true, slug: true } },
      dates: {
        where: { date: { gte: startOfUtcDay(1) }, status: "PUBLISHED" },
        orderBy: { date: "asc" },
        take: 24,
        select: {
          id: true,
          date: true,
          startTime: true,
          capacityTotal: true,
          capacityBooked: true,
        },
      },
    },
  });
  return tours;
}

export type TourCardData = Awaited<ReturnType<typeof listTours>>[number];

export async function getTour(slug: string) {
  const tour = await prisma.tour.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceMinor: true,
      currency: true,
      capacity: true,
      coverImage: { select: { path: true, alt: true } },
      experience: {
        select: {
          slug: true,
          title: true,
          durationMinutes: true,
          highlights: true,
          includes: true,
          meetingPoint: true,
          cancelWindowHours: true,
          capacityMin: true,
        },
      },
      destination: {
        select: { name: true, slug: true, region: true, coverImage: { select: { path: true } } },
      },
    },
  });
  if (!tour) return null;

  const dates = await prisma.tourDate.findMany({
    where: { tourId: tour.id, date: { gte: startOfUtcDay(1) }, status: "PUBLISHED" },
    orderBy: { date: "asc" },
    take: 24,
    select: { id: true, date: true, startTime: true, capacityTotal: true, capacityBooked: true },
  });

  return { tour, dates };
}

// ------------------------------------------------------------
// Availability helper (shared with the booking flow later)
// ------------------------------------------------------------

export async function getDayAvailability(experienceId: string, dateIso: string) {
  const day = await prisma.availability.findUnique({
    where: { experienceId_date: { experienceId, date: new Date(`${dateIso}T00:00:00.000Z`) } },
    select: { capacityTotal: true, capacityBooked: true, closed: true },
  });
  if (!day) return null;
  return {
    date: dateIso,
    capacityTotal: day.capacityTotal,
    capacityBooked: day.capacityBooked,
    closed: day.closed,
    left: Math.max(0, day.capacityTotal - day.capacityBooked),
  };
}
