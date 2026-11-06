import type { Metadata } from "next";
import { getDict, getLocale, LOCALES } from "@/lib/i18n";
import { en } from "@/lib/i18n/dictionaries/en";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { ar } from "@/lib/i18n/dictionaries/ar";
import { AdminPanel, AdminTable, Th, Td, EmptyRow, StatsCard } from "@/components/admin/AdminKit";

export const metadata: Metadata = { title: "Admin — Translations" };

type Dict = Record<string, unknown>;

const DICTS: Record<string, Dict> = { en, fr, ar };

function collectLeaves(node: unknown, prefix: string, out: Set<string>) {
  if (node === null || typeof node !== "object") {
    out.add(prefix);
    return;
  }
  for (const [key, value] of Object.entries(node as Dict)) {
    collectLeaves(value, prefix ? `${prefix}.${key}` : key, out);
  }
}

function topSections(node: Dict): string[] {
  return Object.keys(node);
}

export default async function AdminTranslationsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const t = dict.admin.translations;

  const leavesByLocale = new Map<string, Set<string>>();
  for (const code of LOCALES) {
    const set = new Set<string>();
    collectLeaves(DICTS[code], "", set);
    leavesByLocale.set(code, set);
  }

  const allPaths = new Set<string>();
  for (const set of leavesByLocale.values()) {
    for (const path of set) allPaths.add(path);
  }

  const mismatched = [...allPaths]
    .filter((path) => LOCALES.some((code) => !leavesByLocale.get(code)!.has(path)))
    .sort();

  const sections = topSections(en).map((section) => ({
    section,
    counts: LOCALES.map((code) => {
      const set = new Set<string>();
      collectLeaves((DICTS[code] as Dict)[section], "", set);
      return set.size;
    }),
  }));

  const inSync = mismatched.length === 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{t.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{t.lead}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {LOCALES.map((code) => (
          <StatsCard
            key={code}
            label={`${t.locale} · ${code.toUpperCase()}`}
            value={String(leavesByLocale.get(code)!.size)}
            hint={t.keys}
          />
        ))}
      </div>

      <AdminPanel
        title={t.parity}
        action={
          <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
              inSync
                ? "border-atlas/40 bg-atlas/10 text-atlas"
                : "border-clay/40 bg-clay/10 text-clay"
            }`}
          >
            {inSync ? t.ok : `${t.drift} · ${mismatched.length}`}
          </span>
        }
      >
        <AdminTable minWidth={560}>
          <thead>
            <tr>
              <Th>{t.sections}</Th>
              {LOCALES.map((code) => (
                <Th key={code} className="text-end">
                  {code.toUpperCase()}
                </Th>
              ))}
              <Th>{dict.admin.experiences.status}</Th>
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 ? (
              <EmptyRow colSpan={LOCALES.length + 2} message={dict.common.empty} />
            ) : (
              sections.map((row) => {
                const same = row.counts.every((c) => c === row.counts[0]);
                return (
                  <tr key={row.section} className="hover:bg-ivory/[0.03]">
                    <Td className="font-mono text-xs text-ivory/75">{row.section}</Td>
                    {row.counts.map((count, i) => (
                      <Td key={i} className="text-end text-ivory/70">
                        {count}
                      </Td>
                    ))}
                    <Td>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
                          same
                            ? "border-atlas/40 bg-atlas/10 text-atlas"
                            : "border-clay/40 bg-clay/10 text-clay"
                        }`}
                      >
                        {same ? t.ok : t.drift}
                      </span>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </AdminTable>

        {mismatched.length > 0 ? (
          <ul className="mt-4 space-y-1">
            {mismatched.slice(0, 20).map((path) => (
              <li key={path} className="font-mono text-xs text-clay/80">
                {path}
              </li>
            ))}
          </ul>
        ) : null}
      </AdminPanel>
    </div>
  );
}
