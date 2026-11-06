import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { randomToken, sha256 } from "@/lib/security";
import { logAudit } from "./audit";
import { notify } from "./notifications";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  locale?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ServiceError("EMAIL_TAKEN", 409);

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      locale: input.locale ?? "en",
      roles: {
        create: {
          role: { connect: { name: "CUSTOMER" } },
        },
      },
      customer: {
        create: {
          fullName: input.name.trim(),
          phone: input.phone?.trim() || null,
          locale: input.locale ?? "en",
        },
      },
    },
    select: { id: true, email: true, name: true },
  });

  await notify(user.id, "SYSTEM", "Welcome to AZUL", "Your account is ready — start planning your Morocco.");
  await logAudit({ actorId: user.id, action: "user.register", entity: "User", entityId: user.id });

  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
      customer: { select: { id: true } },
    },
  });
  // Always succeed externally to avoid account enumeration.
  if (!user || user.deletedAt || (!user.passwordHash && !user.customer)) return;

  const token = randomToken();
  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "RESET_PASSWORD",
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/reset?token=${token}`;
  // No transactional email provider is configured in development —
  // the reset link is printed to the server console (documented in the README).
  console.info(`\n[auth] Password reset link for ${user.email}:\n  ${resetUrl}\n`);
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (
    !record ||
    record.type !== "RESET_PASSWORD" ||
    record.consumedAt ||
    record.expiresAt < new Date()
  ) {
    throw new ServiceError("TOKEN_INVALID", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.authToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  await logAudit({
    actorId: record.userId,
    action: "user.password_reset",
    entity: "User",
    entityId: record.userId,
  });
}

export async function updateProfile(
  userId: string,
  input: { name: string; phone?: string; locale?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      locale: input.locale ?? undefined,
    },
    select: { id: true },
  });
  await prisma.customer.updateMany({
    where: { userId },
    data: {
      fullName: input.name.trim(),
      phone: input.phone?.trim() || null,
      ...(input.locale ? { locale: input.locale } : {}),
    },
  });
  await logAudit({ actorId: userId, action: "user.update_profile", entity: "User", entityId: user.id });
  return user;
}

export async function getCustomerByUserId(userId: string) {
  return prisma.customer.findUnique({
    where: { userId },
    select: { id: true, fullName: true, phone: true, country: true, city: true, locale: true },
  });
}
