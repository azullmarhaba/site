import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";
import { PdfWriter, type PdfJpegImage, type Rgb } from "@/lib/pdf/pdf";
import type { Dictionary } from "@/lib/i18n";

// ------------------------------------------------------------
// Client document contracts — PDF generation for every client
// action: booking (contract), payment (invoice), cancellation
// (note) and trip plan (proposal).
// ------------------------------------------------------------

export type DocumentKind = "contract" | "invoice" | "cancellation" | "trip-plan";

export function isDocumentKind(value: string): value is DocumentKind {
  return ["contract", "invoice", "cancellation", "trip-plan"].includes(value);
}

type Row = { label: string; value: string };
type ItemRow = { description: string; qty: string; unit: string; amount: string };

export type DocumentModel = {
  kind: DocumentKind;
  title: string;
  subtitle: string;
  reference: string;
  issuedAt: string;
  meta: Row[];
  columns: { title: string; rows: Row[] }[];
  items?: { head: [string, string, string, string]; rows: ItemRow[] };
  totals?: Row[];
  notes?: { title: string; paragraphs: string[] };
  terms?: { title: string; paragraphs: string[] };
};

// --- formatting helpers --------------------------------------------

function money(minor: number, currency: string): string {
  const amount = minor / 100;
  const s = amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${s} ${currency}`;
}

function longDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function cap(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

// --- PDF layout renderer -------------------------------------------

const GOLD: Rgb = [176, 137, 62];
const INK: Rgb = [30, 28, 26];
const MUTED: Rgb = [122, 116, 108];
const LINE: Rgb = [224, 218, 208];
const SOFT: Rgb = [247, 244, 239];
const CLAY: Rgb = [166, 84, 66];
const LOGO_PATH = path.join(process.cwd(), "public", "brand", "azul-logo-light.png");
let logoPromise: Promise<PdfJpegImage> | undefined;

async function getPdfLogo(): Promise<PdfJpegImage> {
  logoPromise ??= (async () => {
    const source = await readFile(LOGO_PATH);
    const result = await sharp(source)
      .trim()
      .resize({ width: 600, height: 320, fit: "inside", withoutEnlargement: true })
      .flatten({ background: { r: 247, g: 244, b: 239 } })
      .jpeg({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    return { width: result.info.width, height: result.info.height, data: result.data };
  })();
  return logoPromise;
}

class DocumentRenderer {
  private w = new PdfWriter();
  private y = 0;
  private page = 0;
  private readonly M = 54;
  private readonly right: number;
  private readonly bottomLimit = 92;

  constructor(
    private readonly model: DocumentModel,
    private readonly logo: PdfJpegImage
  ) {
    this.right = this.w.width - this.M;
    this.render();
  }

  private get widthArea(): number {
    return this.right - this.M;
  }

  private ensure(space: number): void {
    if (this.y - space < this.bottomLimit) this.newPage();
  }

  private newPage(): void {
    this.drawFooter();
    this.w.addPage();
    this.page += 1;
    this.drawContinuationHeader();
    this.y = this.w.height - this.M - 34;
  }

  private render(): void {
    this.page = 1;
    this.drawFirstHeader();
    this.drawMeta();
    for (const col of this.model.columns) this.drawBoxedGrid(col);
    if (this.model.items) this.drawItems(this.model.items);
    if (this.model.totals && this.model.totals.length) this.drawTotals(this.model.totals);
    if (this.model.notes) this.drawParagraphs(this.model.notes.title, this.model.notes.paragraphs);
    if (this.model.terms) this.drawParagraphs(this.model.terms.title, this.model.terms.paragraphs);
    this.drawFooter();
    this.finishAndWrite();
  }

  private drawFirstHeader(): void {
    const h = this.w.height;
    this.w.rect(0, h - 7, this.w.width, 7, "fill", GOLD);
    const logoHeight = Math.min(42, 112 / (this.logo.width / this.logo.height));
    const logoWidth = logoHeight * (this.logo.width / this.logo.height);
    this.w.addImage(this.logo, this.M, h - 80, logoWidth, logoHeight);
    this.w.textRight(siteConfig.contact.email, this.right, h - 44, { size: 9, color: MUTED });
    this.w.textRight(siteConfig.contact.phone, this.right, h - 57, { size: 9, color: MUTED });
    this.w.textRight(siteConfig.contact.address, this.right, h - 70, { size: 8, color: MUTED });
    this.w.line(this.M, h - 82, this.right, h - 82, LINE);

    this.y = h - 108;
    this.w.text(this.model.title, this.M, this.y, { font: "bold", size: 17, color: INK });
    this.y -= 16;
    this.w.text(this.model.subtitle, this.M, this.y, { size: 9.5, color: MUTED });

    // Reference block (right).
    this.w.textRight(this.model.reference, this.right, h - 108, {
      font: "bold",
      size: 14,
      color: GOLD,
    });
    this.w.textRight(this.model.issuedAt, this.right, h - 124, { size: 8.5, color: MUTED });

    this.y -= 16;
    this.w.line(this.M, this.y, this.right, this.y, LINE);
    this.y -= 22;
  }

  private drawContinuationHeader(): void {
    const h = this.w.height;
    const logoHeight = Math.min(17, 48 / (this.logo.width / this.logo.height));
    const logoWidth = logoHeight * (this.logo.width / this.logo.height);
    this.w.addImage(this.logo, this.M, h - 49, logoWidth, logoHeight);
    this.w.textRight(this.model.reference, this.right, h - 46, { size: 9, color: MUTED });
    this.w.line(this.M, h - 54, this.right, h - 54, LINE);
  }

  private drawMeta(): void {
    const rows = this.model.meta;
    if (!rows.length) return;
    const colWidth = this.widthArea / 2 - 12;
    const perCol = Math.ceil(rows.length / 2);
    let maxY = this.y;

    for (let i = 0; i < rows.length; i++) {
      const col = i < perCol ? 0 : 1;
      const idx = i < perCol ? i : i - perCol;
      const x = this.M + col * (colWidth + 24);
      const rowY = this.y - idx * 30;
      this.w.text(rows[i].label.toUpperCase(), x, rowY, { size: 7, color: MUTED });
      this.w.text(this.truncate(rows[i].value, colWidth, 10), x, rowY - 12, {
        size: 10,
        color: INK,
      });
      maxY = Math.min(maxY, rowY - 12);
    }
    this.y = maxY - 18;
  }

  private drawBoxedGrid(col: { title: string; rows: Row[] }): void {
    const rowH = 15;
    const height = 30 + col.rows.length * rowH + 8;
    this.ensure(height + 14);

    const top = this.y;
    this.w.rect(this.M, top - height, this.widthArea, height, "fill", SOFT);
    this.w.rect(this.M, top - height, 3, height, "fill", GOLD);
    this.w.text(col.title, this.M + 14, top - 18, { font: "bold", size: 9.5, color: INK });

    let ry = top - 34;
    for (const row of col.rows) {
      this.w.text(row.label, this.M + 14, ry, { size: 8.5, color: MUTED });
      const value = this.truncate(row.value, this.widthArea - 180, 9.5);
      this.w.textRight(value, this.right - 14, ry, { size: 9.5, color: INK });
      ry -= rowH;
    }
    this.y = top - height - 14;
  }

  private drawItems(items: { head: [string, string, string, string]; rows: ItemRow[] }): void {
    this.ensure(60);
    const colRight = this.right;
    const qtyX = colRight - 190;
    const unitX = colRight - 100;
    const amountRight = colRight;

    this.w.rect(this.M, this.y - 20, this.widthArea, 20, "fill", GOLD);
    this.w.text(items.head[0], this.M + 8, this.y - 14, { font: "bold", size: 8.5, color: [255, 255, 255] });
    this.w.textRight(items.head[1], unitX, this.y - 14, { font: "bold", size: 8.5, color: [255, 255, 255] });
    this.w.textRight(items.head[2], amountRight, this.y - 14, { font: "bold", size: 8.5, color: [255, 255, 255] });
    this.y -= 20;
    void qtyX;

    for (const row of items.rows) {
      this.ensure(40);
      this.y -= 8;
      const desc = this.truncate(row.description, unitX - this.M - 20, 9.5);
      this.w.text(desc, this.M + 8, this.y, { size: 9.5, color: INK });
      this.w.textRight(row.unit, unitX, this.y, { size: 9.5, color: MUTED });
      this.w.textRight(row.amount, amountRight, this.y, { size: 9.5, color: INK });
      this.y -= 6;
      this.w.line(this.M, this.y, this.right, this.y, LINE);
      this.y -= 8;
    }
    this.y -= 6;
  }

  private drawTotals(rows: Row[]): void {
    this.ensure(rows.length * 18 + 12);
    const boxW = 250;
    const x = this.right - boxW;
    for (const row of rows) {
      const bold = /total|due|paid/i.test(row.label);
      if (bold) {
        this.w.text(row.label, x, this.y, { font: "bold", size: 10, color: INK });
        this.w.textRight(row.value, this.right, this.y, { font: "bold", size: 11, color: GOLD });
      } else {
        this.w.text(row.label, x, this.y, { size: 9.5, color: MUTED });
        this.w.textRight(row.value, this.right, this.y, { size: 9.5, color: INK });
      }
      this.y -= 8;
      if (bold) this.w.line(x, this.y, this.right, this.y, LINE);
      this.y -= 10;
    }
    this.y -= 8;
  }

  private drawParagraphs(title: string, paragraphs: string[]): void {
    this.ensure(50);
    this.w.text(title.toUpperCase(), this.M, this.y, { font: "bold", size: 8.5, color: GOLD });
    this.y -= 15;
    for (const para of paragraphs) {
      for (const line of this.w.wrap(para, "regular", 9.5, this.widthArea)) {
        this.ensure(20);
        this.w.text(line, this.M, this.y, { size: 9.5, color: MUTED });
        this.y -= 13;
      }
      this.y -= 5;
    }
  }

  private drawFooter(): void {
    const fy = 56;
    this.w.line(this.M, fy + 12, this.right, fy + 12, LINE);
    const contact = `AZUL · ${siteConfig.contact.email} · ${siteConfig.contact.phone}`;
    this.w.text(contact, this.M, fy, { size: 7.5, color: MUTED });
    this.w.textRight(`${this.model.kind.toUpperCase()} · ${this.model.reference}`, this.right, fy, {
      size: 7.5,
      color: MUTED,
    });
    this.w.textRight(`Page ${this.page}`, this.right, fy - 12, { size: 7.5, color: CLAY });
  }

  private finishAndWrite(): void {
    this.pdf = this.w.finish();
  }

  private truncate(text: string, maxWidth: number, size: number): string {
    if (this.w.measure(text, "regular", size) <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && this.w.measure(`${out}…`, "regular", size) > maxWidth) {
      out = out.slice(0, -1);
    }
    return `${out}…`;
  }

  pdf!: Buffer;

  getBuffer(): Buffer {
    return this.pdf;
  }
}

export async function renderDocumentPdf(model: DocumentModel): Promise<Buffer> {
  const renderer = new DocumentRenderer(model, await getPdfLogo());
  return renderer.getBuffer();
}

// --- data loads -----------------------------------------------------

export async function getBookingDocumentData(reference: string) {
  return prisma.booking.findUnique({
    where: { reference },
    include: {
      experience: {
        select: {
          title: true,
          slug: true,
          meetingPoint: true,
          cancelWindowHours: true,
          durationMinutes: true,
        },
      },
      pickupLocation: { select: { name: true, address: true } },
      coupon: { select: { code: true } },
      items: true,
      guests2: true,
      payments: { orderBy: { createdAt: "asc" } },
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          country: true,
          city: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
      guide: { include: { user: { select: { name: true } } } },
      tourDate: {
        select: {
          date: true,
          startTime: true,
          tour: { select: { title: true } },
        },
      },
    },
  });
}

export async function getTripPlanDocumentData(shareSlug: string) {
  return prisma.tripPlan.findUnique({
    where: { shareSlug },
    include: {
      customer: {
        select: { fullName: true, phone: true, user: { select: { email: true } } },
      },
    },
  });
}

export type BookingDocumentData = NonNullable<Awaited<ReturnType<typeof getBookingDocumentData>>>;
export type TripPlanDocumentData = NonNullable<Awaited<ReturnType<typeof getTripPlanDocumentData>>>;

// --- model builders -------------------------------------------------

export function buildBookingContract(
  data: BookingDocumentData,
  dict: Dictionary
): DocumentModel {
  const t = dict.documents;
  const m = (minor: number) => money(minor, data.currency);
  const paid = data.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const pickup =
    data.pickupLocation?.name ?? data.pickupAddress ?? dict.booking.pickupNone;
  const journeyDate = `${longDate(data.date)}${
    data.tourDate?.startTime
      ? ` · ${data.tourDate.startTime.toISOString().slice(11, 16)}`
      : ""
  }`;

  const totals: Row[] = [
    { label: t.subtotal, value: m(data.subtotalMinor) },
    ...(data.discountMinor > 0
      ? [{ label: `${t.discount}${data.coupon ? ` · ${data.coupon.code}` : ""}`, value: `−${m(data.discountMinor)}` }]
      : []),
    ...(data.taxMinor > 0 ? [{ label: t.tax, value: m(data.taxMinor) }] : []),
    { label: t.total, value: m(data.totalMinor) },
    { label: t.amountPaid, value: m(paid) },
    { label: t.balance, value: m(Math.max(0, data.totalMinor - paid)) },
  ];

  return {
    kind: "contract",
    title: t.contractTitle,
    subtitle: t.contractSubtitle,
    reference: data.reference,
    issuedAt: `${t.issued} · ${longDate(data.createdAt)}`,
    meta: [
      { label: t.status, value: data.status },
      { label: t.date, value: journeyDate },
      { label: t.mode, value: data.mode === "PRIVATE" ? dict.booking.private : dict.booking.group },
      { label: t.guests, value: `${data.guests} (${data.adults} + ${data.children})` },
    ],
    columns: [
      {
        title: t.travellerDetails,
        rows: [
          { label: t.guest, value: data.customer.fullName },
          { label: t.email, value: data.customer.user.email },
          { label: t.phone, value: data.customer.phone ?? "—" },
          {
            label: t.country,
            value: [data.customer.city, data.customer.country].filter(Boolean).join(", ") || "—",
          },
        ],
      },
      {
        title: t.journeyDetails,
        rows: [
          { label: t.experience, value: data.tourDate?.tour.title ?? data.experience.title },
          { label: t.date, value: journeyDate },
          { label: t.meetingPoint, value: data.experience.meetingPoint ?? "—" },
          { label: t.pickup, value: pickup },
        ],
      },
    ],
    items: {
      head: [t.description, t.unitPrice, t.amount, ""],
      rows: data.items.map((item) => ({
        description: item.label,
        qty: String(item.quantity),
        unit: m(item.unitPriceMinor),
        amount: m(item.totalMinor),
      })),
    },
    totals,
    notes: data.specialRequests
      ? { title: t.specialRequests, paragraphs: [data.specialRequests] }
      : undefined,
    terms: {
      title: t.termsTitle,
      paragraphs: [
        `${t.freeCancellation}: ${data.experience.cancelWindowHours} ${dict.common.hours} ${t.beforeDeparture}.`,
        ...t.bookingTerms,
      ],
    },
  };
}

export function buildInvoice(data: BookingDocumentData, dict: Dictionary): DocumentModel {
  const t = dict.documents;
  const m = (minor: number) => money(minor, data.currency);
  const paid = data.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const lastPaid = [...data.payments].reverse().find((p) => p.status === "PAID");

  const totals: Row[] = [
    { label: t.subtotal, value: m(data.subtotalMinor) },
    ...(data.discountMinor > 0
      ? [{ label: `${t.discount}${data.coupon ? ` · ${data.coupon.code}` : ""}`, value: `−${m(data.discountMinor)}` }]
      : []),
    ...(data.taxMinor > 0 ? [{ label: t.tax, value: m(data.taxMinor) }] : []),
    { label: t.total, value: m(data.totalMinor) },
    { label: t.amountPaid, value: m(paid) },
    { label: t.balance, value: m(Math.max(0, data.totalMinor - paid)) },
  ];

  return {
    kind: "invoice",
    title: t.invoiceTitle,
    subtitle: t.invoiceSubtitle,
    reference: data.reference,
    issuedAt: `${t.issued} · ${longDate(lastPaid?.paidAt ?? data.createdAt)}`,
    meta: [
      { label: t.status, value: lastPaid ? lastPaid.status : data.status },
      { label: t.date, value: longDate(data.date) },
      { label: t.paymentStatus, value: data.payments.length ? data.payments[data.payments.length - 1].status : "—" },
      { label: t.total, value: m(data.totalMinor) },
    ],
    columns: [
      {
        title: t.billedTo,
        rows: [
          { label: t.guest, value: data.customer.fullName },
          { label: t.email, value: data.customer.user.email },
          { label: t.phone, value: data.customer.phone ?? "—" },
          {
            label: t.country,
            value: [data.customer.city, data.customer.country].filter(Boolean).join(", ") || "—",
          },
        ],
      },
      {
        title: t.payment,
        rows: [
          { label: t.experience, value: data.experience.title },
          { label: t.provider, value: lastPaid?.provider ?? "—" },
          { label: t.reference, value: lastPaid?.providerRef ?? data.reference },
          { label: t.paidOn, value: lastPaid?.paidAt ? longDate(lastPaid.paidAt) : "—" },
        ],
      },
    ],
    items: {
      head: [t.description, t.unitPrice, t.amount, ""],
      rows: data.items.map((item) => ({
        description: item.label,
        qty: String(item.quantity),
        unit: m(item.unitPriceMinor),
        amount: m(item.totalMinor),
      })),
    },
    totals,
    terms: { title: t.termsTitle, paragraphs: t.invoiceTerms },
  };
}

export function buildCancellation(data: BookingDocumentData, dict: Dictionary): DocumentModel {
  const t = dict.documents;
  const m = (minor: number) => money(minor, data.currency);
  const refunded = data.payments.reduce((sum, p) => sum + p.refundedMinor, 0);
  const paid = data.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const refundAmount = refunded > 0 ? refunded : paid;

  return {
    kind: "cancellation",
    title: t.cancellationTitle,
    subtitle: t.cancellationSubtitle,
    reference: data.reference,
    issuedAt: `${t.issued} · ${longDate(data.cancelledAt ?? data.updatedAt)}`,
    meta: [
      { label: t.status, value: data.status },
      { label: t.cancelledOn, value: data.cancelledAt ? longDate(data.cancelledAt) : "—" },
      { label: t.date, value: longDate(data.date) },
      { label: t.refundAmount, value: m(refundAmount) },
    ],
    columns: [
      {
        title: t.travellerDetails,
        rows: [
          { label: t.guest, value: data.customer.fullName },
          { label: t.email, value: data.customer.user.email },
          { label: t.phone, value: data.customer.phone ?? "—" },
        ],
      },
      {
        title: t.journeyDetails,
        rows: [
          { label: t.experience, value: data.experience.title },
          { label: t.date, value: longDate(data.date) },
          { label: t.guests, value: `${data.guests} (${data.adults} + ${data.children})` },
        ],
      },
    ],
    totals: [
      { label: t.total, value: m(data.totalMinor) },
      { label: t.amountPaid, value: m(paid) },
      { label: t.refundAmount, value: m(refundAmount) },
    ],
    notes: {
      title: t.cancellationReason,
      paragraphs: [data.cancelReason ?? t.refundNote],
    },
    terms: { title: t.termsTitle, paragraphs: t.cancellationTerms },
  };
}

type ItineraryDay = {
  day: number;
  destination: { name: string; slug: string };
  experience: { title: string; slug: string } | null;
  duration: string;
  description: string;
  costMinor: number;
};

function itineraryOf(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  return value.filter((d): d is ItineraryDay => typeof d === "object" && d !== null);
}

export function buildTripPlanContract(
  data: TripPlanDocumentData,
  dict: Dictionary
): DocumentModel {
  const t = dict.documents;
  const p = dict.planner;
  const days = itineraryOf(data.itinerary);
  const m = (minor: number) => money(minor, data.currency);

  const styles = p.styles as Record<string, string>;
  const budgets = p.budgets as Record<string, string>;

  return {
    kind: "trip-plan",
    title: t.tripPlanTitle,
    subtitle: t.tripPlanSubtitle,
    reference: data.shareSlug.toUpperCase(),
    issuedAt: `${t.issued} · ${longDate(data.createdAt)}`,
    meta: [
      { label: t.days, value: String(data.days) },
      { label: t.travelStyle, value: styles[data.style ?? ""] ?? cap(data.style ?? "—") },
      { label: t.budget, value: budgets[data.budget ?? ""] ?? cap(data.budget ?? "—") },
      { label: t.group, value: cap(data.groupType ?? "—") },
    ],
    columns: [
      {
        title: t.tripDetails,
        rows: [
          { label: t.guest, value: data.customer.fullName },
          { label: t.email, value: data.customer.user.email },
          { label: t.phone, value: data.customer.phone ?? "—" },
        ],
      },
      {
        title: t.interests,
        rows: [
          {
            label: t.interests,
            value: Array.isArray(data.interests)
              ? (data.interests as string[]).join(", ") || "—"
              : "—",
          },
          { label: t.days, value: String(data.days) },
        ],
      },
    ],
    items: {
      head: [t.itinerary, t.duration, t.amount, ""],
      rows: days.map((d) => ({
        description: `${t.day} ${d.day} — ${d.destination.name}${d.experience ? ` · ${d.experience.title}` : ""}`,
        qty: "",
        unit: d.duration,
        amount: m(d.costMinor),
      })),
    },
    totals: [
      { label: t.estimatedTotal, value: m(data.totalMinor) },
    ],
    terms: {
      title: t.termsTitle,
      paragraphs: t.tripTerms,
    },
  };
}

export function buildDocumentModel(
  kind: DocumentKind,
  booking: BookingDocumentData | null,
  plan: TripPlanDocumentData | null,
  dict: Dictionary
): DocumentModel | null {
  if (kind === "trip-plan") return plan ? buildTripPlanContract(plan, dict) : null;
  if (!booking) return null;
  if (kind === "contract") return buildBookingContract(booking, dict);
  if (kind === "invoice") return buildInvoice(booking, dict);
  return buildCancellation(booking, dict);
}
