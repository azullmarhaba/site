import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getDict, getLocale } from "@/lib/i18n";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("STAFF");
  const locale = await getLocale();
  const dict = getDict(locale);

  return (
    <div className="min-h-screen bg-deep text-ivory">
      <AdminHeader
        user={{ name: user.name ?? null, email: user.email ?? "" }}
        labels={{
          title: dict.admin.title,
          site: dict.nav.home,
          account: dict.nav.account,
          signOut: dict.auth.signOut,
          lightMode: dict.nav.lightMode,
          darkMode: dict.nav.darkMode,
        }}
      />
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 pb-16 pt-18 md:flex-row md:gap-8 md:px-6 md:pt-20">
        <AdminSidebar nav={dict.admin.nav} groups={dict.admin.navGroups} />
        <main id="main" className="min-w-0 flex-1 py-2 md:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
