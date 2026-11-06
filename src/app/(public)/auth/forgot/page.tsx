import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { ForgotForm } from "@/components/auth/ForgotForm";
import { Section } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.auth.forgotTitle,
    description: dict.auth.forgotLead,
    alternates: { canonical: "/auth/forgot" },
  };
}

export default async function ForgotPage() {
  const dict = getDict(await getLocale());

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <ForgotForm labels={dict.auth} />
      </div>
    </Section>
  );
}
