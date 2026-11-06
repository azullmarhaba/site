import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { LoginForm } from "@/components/auth/LoginForm";
import { Section } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.auth.signInTitle,
    description: dict.auth.signInLead,
    alternates: { canonical: "/auth/login" },
  };
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  const dict = getDict(await getLocale());

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <Suspense>
          <LoginForm labels={dict.auth} />
        </Suspense>
      </div>
    </Section>
  );
}
