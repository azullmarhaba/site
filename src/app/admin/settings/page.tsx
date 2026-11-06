import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { getSettings } from "@/server/services/settings";
import { AdminPanel } from "@/components/admin/AdminKit";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const s = dict.admin.settings;
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{s.title}</h1>
      </header>

      <AdminPanel>
        <SettingsForm
          initial={{
            taxRate: settings.taxRate,
            minBookingNoticeHours: settings.minBookingNoticeHours,
            defaultCancelWindowHours: settings.defaultCancelWindowHours,
            whatsappNumber: settings.whatsappNumber,
            contactEmail: settings.contactEmail,
          }}
          labels={{
            taxRate: s.taxRate,
            bookingNotice: s.bookingNotice,
            cancelWindow: s.cancelWindow,
            whatsapp: s.whatsapp,
            contactEmail: s.contactEmail,
            save: s.save,
            saved: s.saved,
            error: dict.common.error,
          }}
        />
      </AdminPanel>
    </div>
  );
}
