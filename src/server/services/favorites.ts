import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "./users";

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      experience: {
        select: {
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
        },
      },
    },
  });
}

export async function toggleFavorite(userId: string, experienceSlug: string) {
  const experience = await prisma.experience.findUnique({
    where: { slug: experienceSlug },
    select: { id: true },
  });
  if (!experience) throw new ServiceError("NOT_FOUND", 404);

  const key = { userId_experienceId: { userId, experienceId: experience.id } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
    return { favorited: false };
  }
  await prisma.favorite.create({ data: { userId, experienceId: experience.id } });
  return { favorited: true };
}
