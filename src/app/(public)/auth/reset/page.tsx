import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { ResetForm } from "@/components/auth/ResetForm";
import { Section } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.auth.resetTitle,
    description: dict.auth.resetTitle,
    alternates: { canonical: "/auth/reset" },
  };
}

export default async function ResetPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await props.searchParams;
  const dict = getDict(await getLocale());
  const token = sp.token?.trim() ?? "";

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <ResetForm labels={dict.auth} token={token} />
      </div>
    </Section>
  );
}
