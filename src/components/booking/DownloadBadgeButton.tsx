"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

type BadgeData = {
  reference: string;
  status: string;
  date: string;
  departureTime?: string;
  adults: number;
  childCount: number;
  experienceTitle: string;
  coverImage: { path: string; alt: string | null } | null;
  customerName: string;
  customerEmail: string;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  couponCode: string | null;
  couponPercentOff: number | null;
  locale: string;
};

const SAND = "#c89b6d";
const INK = "#080808";

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "right" | "center" = "left"
): number {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  return total;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let dw: number, dh: number;
  if (ir > r) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

async function renderBadge(data: BadgeData): Promise<Blob | null> {
  const W = 1680;
  const H = 1050;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    await Promise.all([
      document.fonts.load('600 90px Fraunces'),
      document.fonts.load('500 70px Fraunces'),
      document.fonts.load('500 34px Inter'),
      document.fonts.load('600 40px Inter'),
      document.fonts.load('700 44px Inter'),
    ]);
    await document.fonts.ready;
  } catch {
    // fall back to system fonts
  }

  // --- Background: cover photo, else brand gradient
  if (data.coverImage) {
    try {
      const img = await loadImage(data.coverImage.path);
      drawCoverFit(ctx, img, W, H);
    } catch {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#17130f");
      g.addColorStop(0.55, "#111111");
      g.addColorStop(1, "#080808");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#17130f");
    g.addColorStop(0.55, "#111111");
    g.addColorStop(1, "#080808");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // --- Cinematic gradient overlay
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0.18)");
  overlay.addColorStop(0.45, "rgba(0,0,0,0.32)");
  overlay.addColorStop(1, "rgba(0,0,0,0.86)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const pad = 100;
  let cursorY = pad + 14;

  // --- Brand block (top-left)
  roundRectPath(ctx, pad, cursorY, 150, 150, 34);
  ctx.fillStyle = SAND;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = "600 84px Fraunces, Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", pad + 75, cursorY + 82);

  const textX = pad + 190;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "600 58px Fraunces, Georgia, serif";
  ctx.fillText(siteConfig.name, textX, cursorY + 58);
  ctx.font = "500 27px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  drawSpaced(ctx, siteConfig.descriptor.toUpperCase(), textX + 2, cursorY + 116, 10);
  cursorY += 150;

  // --- Status chip (top-right)
  ctx.font = "600 26px Inter, system-ui, sans-serif";
  const statusText = data.status.toUpperCase();
  const chipPadX = 26;
  const chipW = ctx.measureText(statusText).width + chipPadX * 2;
  const chipH = 58;
  const chipX = W - pad - chipW;
  roundRectPath(ctx, chipX, pad + 14, chipW, chipH, chipH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  drawSpaced(ctx, statusText, chipX + chipPadX, pad + 14 + chipH / 2 + 1, 6);

  // --- Content column (bottom-up layout)
  const colX = pad;
  const colW = W - pad * 2;
  const hasDiscount = data.discountMinor > 0;
  const gridTop = 470;
  const cellH = 140;
  const gridBottom = gridTop + cellH * 2;

  // Reference
  ctx.textAlign = "left";
  ctx.font = "500 27px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  drawSpaced(ctx, "BOOKING REFERENCE", colX, 330, 10);
  ctx.font = "600 66px Fraunces, Georgia, serif";
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fillText(data.reference, colX, 406);

  // Facts grid (2 x 2)
  const cellW = colW / 2 - 30;
  const cellGap = 60;
  const facts: { label: string; value: string; sub?: string; accent?: boolean }[] = [
    { label: "EXPERIENCE", value: data.experienceTitle },
    {
      label: "DATE",
      value: formatDate(new Date(data.date), data.locale),
      sub: data.departureTime,
    },
    {
      label: "GUESTS",
      value: `${data.adults} adult${data.adults > 1 ? "s" : ""}${
        data.childCount > 0 ? ` + ${data.childCount} child${data.childCount > 1 ? "ren" : ""}` : ""
      }`,
    },
    { label: "TOTAL", value: formatPrice(data.totalMinor, data.locale), accent: true },
  ];

  facts.forEach((f, i) => {
    const fx = colX + (i % 2) * (cellW + cellGap);
    const fy = gridTop + Math.floor(i / 2) * cellH;
    ctx.textAlign = "left";
    ctx.font = "500 23px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    drawSpaced(ctx, f.label, fx, fy, 8);
    if (f.accent) {
      ctx.font = "600 44px Fraunces, Georgia, serif";
      ctx.fillStyle = SAND;
    } else {
      ctx.font = "500 36px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
    }
    // truncate long values to the cell width
    let value = f.value;
    const maxWidth = cellW;
    while (value.length > 4 && ctx.measureText(value).width > maxWidth) {
      value = value.slice(0, -1);
    }
    if (value !== f.value) value = `${value.slice(0, -1)}…`;
    ctx.fillText(value, fx, fy + 56);
    if (f.sub) {
      ctx.font = "400 26px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(f.sub, fx, fy + 100);
    }
  });

  // Coupon strip
  const couponH = 64;
  const couponTop = gridBottom + 20;
  if (hasDiscount) {
    const stripW = colW * 0.62;
    roundRectPath(ctx, colX, couponTop, stripW, couponH, 18);
    ctx.fillStyle = "rgba(200,155,109,0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(200,155,109,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.font = "600 25px Inter, system-ui, sans-serif";
    ctx.fillStyle = SAND;
    const couponText = `COUPON ${data.couponCode ?? ""}`;
    drawSpaced(ctx, couponText, colX + 32, couponTop + couponH / 2 + 1, 6);
    ctx.font = "600 30px Inter, system-ui, sans-serif";
    const discountText = `-${formatPrice(data.discountMinor, data.locale)}${
      data.couponPercentOff ? ` (${data.couponPercentOff}% OFF)` : ""
    }`;
    ctx.fillText(
      discountText,
      colX + 32 + ctx.measureText(couponText).width + 60,
      couponTop + couponH / 2 + 1
    );
  }

  // Footer row inside the card
  const dividerY = (hasDiscount ? couponTop + couponH : gridBottom) + 44;
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(colX, dividerY);
  ctx.lineTo(colX + colW, dividerY);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  drawSpaced(ctx, "GUEST", colX, dividerY + 36, 8);
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(data.customerName, colX, dividerY + 74);
  ctx.font = "400 24px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(data.customerEmail, colX, dividerY + 110);

  ctx.textAlign = "right";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  drawSpaced(ctx, "PAID", colX + colW, dividerY + 36, 8, "right");
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(data.currency, colX + colW, dividerY + 74);

  // --- Outer divider caption
  ctx.textAlign = "center";
  ctx.font = "500 26px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,241,232,0.3)";
  drawSpaced(ctx, "AZUL · MARHABA MOROCCO", W / 2, H - 26, 12, "center");

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function DownloadBadgeButton({
  data,
  label,
  preparingLabel,
  tone = "solid",
}: {
  data: BadgeData;
  label: string;
  preparingLabel: string;
  tone?: "solid" | "outline";
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const blob = await renderBadge(data);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `azul-booking-${data.reference.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  const base =
    "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]";
  const styles =
    tone === "solid"
      ? "bg-sand text-obsidian hover:bg-sand-bright shadow-[0_14px_34px_-16px_rgba(200,155,109,0.7)]"
      : "border border-ivory/25 text-ivory hover:border-sand hover:text-sand";

  return (
    <button type="button" onClick={download} disabled={busy} className={`${base} ${styles}`}>
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      {busy ? preparingLabel : label}
    </button>
  );
}
