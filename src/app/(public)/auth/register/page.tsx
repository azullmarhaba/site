import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Section } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.auth.registerTitle,
    description: dict.auth.registerLead,
    alternates: { canonical: "/auth/register" },
  };
}

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  const dict = getDict(await getLocale());

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <RegisterForm labels={dict.auth} />
      </div>
    </Section>
  );
}
