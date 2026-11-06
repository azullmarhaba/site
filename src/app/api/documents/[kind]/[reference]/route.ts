import { jsonError } from "@/lib/api";
import { getDict, getLocale } from "@/lib/i18n";
import {
  buildDocumentModel,
  getBookingDocumentData,
  getTripPlanDocumentData,
  isDocumentKind,
  renderDocumentPdf,
} from "@/server/services/contracts";

// Client document PDFs (contract / invoice / cancellation / trip-plan).
// Booking documents are addressed by the booking reference and trip
// plans by their share slug — both act as capabilities, mirroring the
// already-public booking confirmation and shared itinerary pages.

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/documents/[kind]/[reference]">
) {
  const { kind, reference } = await ctx.params;
  if (!isDocumentKind(kind)) return jsonError("Unknown document type", 404);

  const locale = await getLocale();
  const dict = getDict(locale === "fr" ? "fr" : "en");

  const isTripPlan = kind === "trip-plan";
  const booking = isTripPlan ? null : await getBookingDocumentData(reference);
  const plan = isTripPlan ? await getTripPlanDocumentData(reference) : null;

  const model = buildDocumentModel(kind, booking, plan, dict);
  if (!model) return jsonError("Document not found", 404);

  const pdf = await renderDocumentPdf(model);
  const filename = `AZUL-${model.kind}-${model.reference}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
