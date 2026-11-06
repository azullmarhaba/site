import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { getCustomerByUserId } from "@/server/services/users";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  const locale = await getLocale();
  const dict = getDict(locale);
  const customer = await getCustomerByUserId(user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl">{dict.account.nav.profile}</h2>
      <ProfileForm
        initial={{
          name: user.name ?? "",
          email: user.email ?? "",
          phone: customer?.phone ?? "",
        }}
        labels={{
          firstName: dict.booking.firstName,
          phone: dict.booking.phone,
          email: dict.booking.email,
          save: dict.account.profileSave,
          saved: dict.account.profileSaved,
          error: dict.common.error,
          readonly: dict.account.emailReadonly,
        }}
      />
    </div>
  );
}
