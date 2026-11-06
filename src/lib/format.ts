export function formatPrice(minor: number, locale = "en"): string {
  const amount = minor / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale, {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const h = Math.round(minutes / 60);
    return `${h} h`;
  }
  const d = Math.round(minutes / (24 * 60));
  return `${d} day${d > 1 ? "s" : ""}`;
}

export function formatDate(date: Date, locale = "en"): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  ).format(date);
}

export function nextReferencePrefix(): string {
  return "AZL-2027-";
}
