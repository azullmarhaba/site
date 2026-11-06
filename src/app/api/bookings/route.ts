import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { bookingSchema } from "@/lib/validation";
import { createBooking, ServiceError } from "@/server/services/booking";
import { rateLimit } from "@/lib/security";
import { apiUser } from "@/lib/auth/guards";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`booking:${ip}`, 10, 60_000)) {
    return jsonError("Too many attempts", 429);
  }

  const parsed = await parseBody(request, bookingSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  const user = await apiUser();

  try {
    const booking = await createBooking({
      ...parsed.data,
      pickupLocationId: parsed.data.pickupLocationId || undefined,
      pickupAddress: parsed.data.pickupAddress || undefined,
      specialRequests: parsed.data.specialRequests || undefined,
      couponCode: parsed.data.couponCode || undefined,
      tourDateId: parsed.data.tourDateId || undefined,
      userId: user?.id,
    });
    return jsonOk(
      { reference: booking.reference, status: booking.status, totalMinor: booking.totalMinor, currency: booking.currency },
      201
    );
  } catch (err) {
    if (err instanceof ServiceError) return jsonError(err.message, err.status);
    console.error("[booking]", err);
    return jsonError("Booking failed", 500);
  }
}
