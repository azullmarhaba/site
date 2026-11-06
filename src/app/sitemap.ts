import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

const STATIC_PATHS = [
  "",
  "/experiences",
  "/destinations",
  "/tours",
  "/plan-my-trip",
  "/custom-tour",
  "/blog",
  "/reviews",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const [destinations, experiences, tours, posts] = await Promise.all([
    prisma.destination.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.experience.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.tour.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
    priority: path === "" ? 1 : 0.7,
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...destinations.map((d) => ({
      url: `${base}/destinations/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...experiences.map((e) => ({
      url: `${base}/experiences/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...tours.map((t) => ({
      url: `${base}/tours/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticEntries, ...dynamicEntries];
}
