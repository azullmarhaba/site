"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = {
  stage: string;
  ownerLabel: string;
  source: string;
  tags: string;
  save: string;
  saved: string;
  tagPlaceholder: string;
  unassigned: string;
};

type CrmTag = { id: string; name: string };

export function CrmQualificationForm({
  customerId,
  initialStage,
  initialSource,
  initialOwnerId,
  initialTags,
  stages,
  staff,
  allTags,
  labels,
}: {
  customerId: string;
  initialStage: string;
  initialSource: string | null;
  initialOwnerId: string | null;
  initialTags: CrmTag[];
  stages: { value: string; label: string }[];
  staff: { id: string; name: string }[];
  allTags: CrmTag[];
  labels: Labels;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [source, setSource] = useState(initialSource ?? "");
  const [ownerId, setOwnerId] = useState(initialOwnerId ?? "");
  const [tags, setTags] = useState<CrmTag[]>(initialTags);
  const [tagText, setTagText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const addTag = async () => {
    const name = tagText.trim();
    if (!name) return;
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setTagText("");
      return;
    }
    try {
      const res = await fetch("/api/admin/crm/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (res.ok && data.id) {
        setTags((t) => [...t, { id: data.id!, name }]);
        setTagText("");
      }
    } catch {
      /* ignore */
    }
  };

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/crm/clients/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          source: source.trim() || null,
          ownerId: ownerId || null,
          tagIds: tags.map((t) => t.id),
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const selectCls =
    "w-full rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory focus:border-sand/60 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.stage}
          </span>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
            {stages.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.ownerLabel}
          </span>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={selectCls}>
            <option value="">{labels.unassigned}</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
          {labels.source}
        </span>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Website · WhatsApp · Referral · Instagram…"
          className={selectCls}
        />
      </label>
      <div>
        <span className="mb-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
          {labels.tags}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x.id !== t.id))}
              className="group rounded-full border border-ivory/20 bg-ivory/10 px-2.5 py-0.5 text-xs text-ivory/80"
            >
              {t.name}
              <span className="ml-1 text-ivory/45 group-hover:text-clay">×</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            list="crm-tags"
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addTag();
              }
            }}
            placeholder={labels.tagPlaceholder}
            className="flex-1 rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory placeholder:text-ivory/35 focus:border-sand/60 focus:outline-none"
          />
          <datalist id="crm-tags">
            {allTags.map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => void addTag()}
            className="rounded-lg border border-ivory/15 px-3 text-sm text-ivory/80 hover:border-sand/50"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="rounded-lg bg-sand px-4 py-2 text-sm font-medium text-obsidian hover:brightness-110 disabled:opacity-50"
        >
          {labels.save}
        </button>
        {saved ? <span className="text-sm text-ivory/60">{labels.saved}</span> : null}
      </div>
    </div>
  );
}