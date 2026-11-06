import { prisma } from "@/lib/db/prisma";

// ------------------------------------------------------------
// Blog
// ------------------------------------------------------------

export async function listPosts(limit = 20) {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      readingMinutes: true,
      publishedAt: true,
      authorName: true,
      coverImage: { select: { path: true, alt: true } },
      category: { select: { name: true, slug: true } },
    },
  });
}

export async function getPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      readingMinutes: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      authorName: true,
      seoTitle: true,
      seoDescription: true,
      coverImage: { select: { path: true, alt: true } },
      category: { select: { name: true, slug: true } },
    },
  });
  return post;
}

// ------------------------------------------------------------
// FAQ
// ------------------------------------------------------------

export async function listFaqs(experienceId?: string) {
  return prisma.faq.findMany({
    where: {
      active: true,
      ...(experienceId ? { experienceId } : {}),
    },
    orderBy: [{ category: "asc" }, { position: "asc" }],
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      experienceId: true,
    },
  });
}

// ------------------------------------------------------------
// Reviews (public)
// ------------------------------------------------------------

export async function listPublicReviews(limit = 24) {
  return prisma.review.findMany({
    where: { status: "APPROVED", deletedAt: null },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      customer: { select: { fullName: true, country: true } },
      experience: { select: { title: true, slug: true } },
    },
  });
}

export async function getReviewStats() {
  const agg = await prisma.review.aggregate({
    where: { status: "APPROVED", deletedAt: null },
    _avg: { rating: true },
    _count: true,
  });
  return { average: Number((agg._avg.rating ?? 0).toFixed(1)), count: agg._count };
}

// ------------------------------------------------------------
// Pickup locations
// ------------------------------------------------------------

export async function listPickupLocations() {
  return prisma.pickupLocation.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { position: "asc" },
    select: { id: true, name: true, address: true },
  });
}
