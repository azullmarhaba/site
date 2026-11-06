import { Header } from "@/components/layout/Header";
import { AccountNav } from "@/components/account/AccountNav";
import { getDict, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth";
import { requireUser, atLeast } from "@/lib/auth/guards";
import { siteConfig } from "@/config/site";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/account");
  const locale = await getLocale();
  const dict = getDict(locale);
  const session = await auth();

  return (
    <>
      <Header
        nav={dict.nav}
        localeLabels={dict.locale}
        locale={locale}
        user={{ name: session?.user?.name ?? user.name ?? null, isAdmin: atLeast(user, "STAFF") }}
        authLabels={{
          signIn: dict.nav.signIn,
          signUp: dict.nav.signUp,
          account: dict.nav.account,
          admin: dict.nav.admin,
          signOut: dict.auth.signOut,
        }}
      />
      <main id="main" className="min-h-screen bg-obsidian pb-24 pt-28 text-ivory md:pt-32">
        <div className="container-azul">
          <p className="eyebrow mb-3">{siteConfig.descriptor}</p>
          <h1 className="mb-2 text-3xl md:text-4xl">{dict.account.title}</h1>
          <p className="mb-10 text-sm text-ivory/55">
            {dict.account.welcome}
            {user.name ? `, ${user.name}` : ""} · {user.email}
          </p>
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <AccountNav labels={dict.account.nav} />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
