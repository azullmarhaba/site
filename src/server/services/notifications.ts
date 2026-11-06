import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  payload?: object
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: body ?? null,
        payload: payload !== undefined ? (payload as object) : undefined,
      },
    });
  } catch {
    // notifications must never block the main flow
  }
}

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markNotificationsRead(userId: string, id?: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(id ? { id } : {}) },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
