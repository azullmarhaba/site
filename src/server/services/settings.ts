import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "./users";

export type SiteSettings = {
  taxRate: number; // percent, e.g. 0 or 10
  minBookingNoticeHours: number;
  defaultCancelWindowHours: number;
  whatsappNumber: string;
  contactEmail: string;
};

const DEFAULTS: SiteSettings = {
  taxRate: 0,
  minBookingNoticeHours: 24,
  defaultCancelWindowHours: 48,
  whatsappNumber: "",
  contactEmail: "hello@azul.ma",
};

export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const pick = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
    const raw = map.get(key);
    if (raw === undefined) return DEFAULTS[key];
    return raw as SiteSettings[K];
  };
  return {
    taxRate: Number(pick("taxRate")),
    minBookingNoticeHours: Number(pick("minBookingNoticeHours")),
    defaultCancelWindowHours: Number(pick("defaultCancelWindowHours")),
    whatsappNumber: String(pick("whatsappNumber")),
    contactEmail: String(pick("contactEmail")),
  };
}

export async function saveSettings(input: Partial<SiteSettings>) {
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as unknown as object },
      create: { key, value: value as unknown as object },
    });
  }
}

export async function getSettingNumber(key: keyof SiteSettings): Promise<number> {
  const s = await getSettings();
  const value = s[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ServiceError("INVALID_SETTING", 500);
  }
  return value;
}
