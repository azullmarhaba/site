import { jsonError, jsonOk } from "@/lib/api";
import { getBookingByReference } from "@/server/services/booking";

const REFERENCE_PATTERN = /^AZL-\d{4}-\d{6}$/;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/bookings/[reference]">
) {
  const { reference } = await ctx.params;
  if (!REFERENCE_PATTERN.test(reference)) {
    return jsonError("Invalid reference", 400);
  }
  const booking = await getBookingByReference(reference);
  if (!booking) return jsonError("Not found", 404);
  return jsonOk({
    reference: booking.reference,
    status: booking.status,
    mode: booking.mode,
    date: booking.date.toISOString().slice(0, 10),
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
    totalMinor: booking.totalMinor,
    currency: booking.currency,
    experience: booking.experience,
    pickupLocation: booking.pickupLocation,
    pickupAddress: booking.pickupAddress,
    meetingPoint: booking.experience.meetingPoint,
    payments: booking.payments.map((p) => ({
      status: p.status,
      amountMinor: p.amountMinor,
      currency: p.currency,
      paidAt: p.paidAt,
      provider: p.provider,
    })),
  });
}
