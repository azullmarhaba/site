import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Cash on Delivery — settled in person by the guide. */
export const CASH_PROVIDER = "CASH";

function codReference() {
  return `cod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Record a Cash-on-Delivery payment. The booking is confirmed, the money is
 * collected on the day, so the payment starts as PENDING until staff settle it.
 * Accepts a transaction client so it can be created atomically with the booking.
 */
export async function createCodPayment(
  client: Prisma.TransactionClient | typeof prisma,
  input: { bookingId: string; amountMinor: number; currency: string }
) {
  return client.payment.create({
    data: {
      bookingId: input.bookingId,
      provider: CASH_PROVIDER,
      providerRef: codReference(),
      amountMinor: input.amountMinor,
      currency: input.currency,
      status: "PENDING",
      mode: "DEVELOPMENT",
    },
  });
}

/** Mark the booking's outstanding cash payment as collected. */
export async function settleCodPayment(bookingId: string) {
  return prisma.payment.updateMany({
    where: { bookingId, provider: CASH_PROVIDER, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function refundPayment(bookingId: string) {
  const payments = await prisma.payment.findMany({
    where: { bookingId, status: "PAID" },
  });
  let refunded = 0;
  for (const p of payments) {
    const amount = p.amountMinor - p.refundedMinor;
    if (amount <= 0) continue;
    await prisma.payment.update({
      where: { id: p.id },
      data: {
        status: "REFUNDED",
        refundedMinor: p.amountMinor,
      },
    });
    refunded += amount;
  }
  return refunded;
}
