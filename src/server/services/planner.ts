import { prisma } from "@/lib/db/prisma";
import { randomBytes } from "crypto";
import { ServiceError } from "./users";

const INTEREST_TO_CATEGORY: Record<string, string> = {
  adventure: "adventure",
  culture: "culture",
  nature: "nature",
  food: "food",
  luxury: "luxury",
  desert: "desert",
  photography: "culture",
  relaxation: "coast",
};

const BUDGET_FACTOR: Record<string, number> = {
  economy: 0.7,
  comfort: 1,
  premium: 1.5,
};

export type PlannerInput = {
  days: number;
  style: string;
  interests: string[];
  budget: string;
  groupType?: string;
};

export type PlannerDay = {
  day: number;
  destination: { name: string; slug: string };
  experience: { title: string; slug: string } | null;
  duration: string;
  description: string;
  costMinor: number;
};

/**
 * Draft an itinerary by matching the traveller's interests to published
 * experiences, ordered by destination flow (Marrakech first, coast/desert later).
 */
export async function generateItinerary(input: PlannerInput): Promise<{
  days: PlannerDay[];
  totalMinor: number;
  currency: string;
}> {
  const categorySlugs = [
    ...new Set(
      input.interests
        .map((i) => INTEREST_TO_CATEGORY[i])
        .filter((s): s is string => Boolean(s))
    ),
  ];

  const experiences = await prisma.experience.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(categorySlugs.length
        ? { category: { slug: { in: categorySlugs } } }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
    take: 30,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      priceMinor: true,
      currency: true,
      durationMinutes: true,
      destination: { select: { name: true, slug: true, position: true } },
    },
  });

  if (experiences.length === 0) {
    throw new ServiceError("NO_MATCHES", 404);
  }

  const factor = BUDGET_FACTOR[input.budget] ?? 1;
  const dayCount = input.days;

  // Round-robin across distinct destinations for a natural geographic flow.
  const byDestination = new Map<string, typeof experiences>();
  for (const e of experiences) {
    const list = byDestination.get(e.destination.slug) ?? [];
    list.push(e);
    byDestination.set(e.destination.slug, list);
  }
  const queues = [...byDestination.values()];
  // Start with Marrakech when present (position ordering from seed).
  queues.sort((a, b) => (a[0]?.destination.position ?? 0) - (b[0]?.destination.position ?? 0));

  const days: PlannerDay[] = [];
  let totalMinor = 0;
  let cursor = 0;

  for (let d = 1; d <= dayCount; d++) {
    const queue = queues[cursor % queues.length];
    const experience = queue?.shift();
    cursor += 1;

    if (!experience) {
      // Ran out of fresh experiences — reuse the strongest match.
      const fallback = experiences[(d - 1) % experiences.length];
      days.push({
        day: d,
        destination: fallback.destination,
        experience: { title: fallback.title, slug: fallback.slug },
        duration: `${Math.max(1, Math.round(fallback.durationMinutes / 60))} h`,
        description: fallback.summary ?? fallback.description.slice(0, 160),
        costMinor: Math.round(fallback.priceMinor * factor),
      });
      totalMinor += Math.round(fallback.priceMinor * factor);
      continue;
    }

    const cost = Math.round(experience.priceMinor * factor);
    totalMinor += cost;
    days.push({
      day: d,
      destination: experience.destination,
      experience: { title: experience.title, slug: experience.slug },
      duration: `${Math.max(1, Math.round(experience.durationMinutes / 60))} h`,
      description: experience.summary ?? experience.description.slice(0, 160),
      costMinor: cost,
    });
  }

  return { days, totalMinor, currency: "MAD" };
}

export async function saveTripPlan(input: {
  customerId: string;
  title?: string;
  planner: PlannerInput;
  itinerary: PlannerDay[];
  totalMinor: number;
  currency?: string;
}) {
  const shareSlug = randomBytes(6).toString("hex");
  const plan = await prisma.tripPlan.create({
    data: {
      customerId: input.customerId,
      title: input.title?.trim() || `Morocco in ${input.planner.days} days`,
      shareSlug,
      days: input.planner.days,
      style: input.planner.style,
      interests: input.planner.interests,
      budget: input.planner.budget,
      groupType: input.planner.groupType ?? null,
      itinerary: input.itinerary,
      totalMinor: input.totalMinor,
      currency: input.currency ?? "MAD",
    },
  });
  return plan;
}

export async function getTripPlanBySlug(shareSlug: string) {
  const plan = await prisma.tripPlan.findUnique({
    where: { shareSlug },
    include: {
      customer: { select: { fullName: true } },
    },
  });
  if (!plan) throw new ServiceError("NOT_FOUND", 404);
  return plan;
}
