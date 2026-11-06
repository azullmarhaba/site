import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getDict, getLocale } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { auth } from "@/lib/auth";
import { atLeast } from "@/lib/auth/guards";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dict = getDict(locale);
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <>
      <Header
        nav={dict.nav}
        localeLabels={dict.locale}
        locale={locale}
        user={
          user
            ? { name: user.name ?? null, isAdmin: atLeast(user, "STAFF") }
            : null
        }
        authLabels={{
          signIn: dict.nav.signIn,
          signUp: dict.nav.signUp,
          account: dict.nav.account,
          admin: dict.nav.admin,
          signOut: dict.auth.signOut,
        }}
      />
      <main id="main">{children}</main>
      <Footer dict={dict} />
      <WhatsAppFab
        number={siteConfig.whatsapp.number}
        label={dict.whatsapp.label}
        message={dict.whatsapp.message}
      />
    </>
  );
}
