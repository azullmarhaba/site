"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Labels = {
  searchPlaceholder: string;
  allStages: string;
  allOwners: string;
  allTags: string;
  stage: string;
  owner: string;
  tag: string;
};

export function CrmFilters({
  labels,
  stages,
  owners,
  tags,
}: {
  labels: Labels;
  stages: { value: string; label: string }[];
  owners: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const apply = (patch: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/admin/crm/clients?${p.toString()}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q });
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory placeholder:text-ivory/35 focus:border-sand/60 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="rounded-lg border border-ivory/15 px-4 py-2 text-sm text-ivory/80 hover:border-sand/50 hover:text-ivory"
        >
          →
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label={labels.stage}
          defaultValue={sp.get("stage") ?? ""}
          onChange={(e) => apply({ stage: e.target.value })}
          className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory/80 focus:border-sand/60 focus:outline-none"
        >
          <option value="">{labels.allStages}</option>
          {stages.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label={labels.owner}
          defaultValue={sp.get("ownerId") ?? ""}
          onChange={(e) => apply({ ownerId: e.target.value })}
          className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory/80 focus:border-sand/60 focus:outline-none"
        >
          <option value="">{labels.allOwners}</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          aria-label={labels.tag}
          defaultValue={sp.get("tagId") ?? ""}
          onChange={(e) => apply({ tagId: e.target.value })}
          className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory/80 focus:border-sand/60 focus:outline-none"
        >
          <option value="">{labels.allTags}</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}