"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { StagePill } from "@/components/admin/crm/StagePill";

type LeadRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  source: string | null;
  stage: string;
  owner: { id: string; name: string } | null;
  convertedCustomer: { id: string } | null;
};

type Labels = {
  create: string;
  import: string;
  search: string;
  allStages: string;
  allOwners: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  owner: string;
  unassigned: string;
  submit: string;
  uploading: string;
  stage: string;
  lead: string;
  convert: string;
  converted: string;
  openCustomer: string;
  empty: string;
  imported: string;
  rejected: string;
  duplicate: string;
  invalid: string;
  accountConflict: string;
  error: string;
};

export function CrmLeadsManager({
  leads,
  staff,
  stageLabels,
  labels,
}: {
  leads: LeadRow[];
  staff: { id: string; name: string }[];
  stageLabels: Record<string, string>;
  labels: Labels;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", source: "", ownerId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<{ row: number; error: string }[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [ownerId, setOwnerId] = useState("");

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ownerId: form.ownerId || null }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error === "LEAD_EMAIL_EXISTS" ? labels.duplicate : result.error ?? labels.error);
        return;
      }
      setForm({ fullName: "", email: "", phone: "", source: "", ownerId: "" });
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(file: File) {
    setBusy(true);
    setError(null);
    setImportSummary(null);
    setImportErrors([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/crm/leads/import", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? labels.error);
        return;
      }
      setImportSummary(`${labels.imported}: ${result.data.imported} · ${labels.rejected}: ${result.data.rejected}`);
      setImportErrors(
        result.data.results
          .filter((item: { status: string }) => item.status === "error")
          .map((item: { row: number; error: string }) => ({
            row: item.row,
            error: item.error === "LEAD_EMAIL_EXISTS" ? labels.duplicate : item.error,
          }))
      );
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function updateLead(id: string, stage: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error ?? labels.error);
        return;
      }
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function convertLead(id: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/crm/leads/${id}/convert`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error === "EMAIL_ACCOUNT_EXISTS" ? labels.accountConflict : result.error ?? labels.error);
        return;
      }
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "h-10 min-w-0 rounded-xl border border-ivory/15 bg-carbon px-3 text-sm text-ivory outline-none focus:border-sand";
  const filteredLeads = leads.filter((lead) => {
    const text = query.trim().toLowerCase();
    return (
      (!text || [lead.fullName, lead.email, lead.phone, lead.source].some((value) => value?.toLowerCase().includes(text))) &&
      (!stage || lead.stage === stage) &&
      (!ownerId || lead.owner?.id === ownerId)
    );
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ivory/10 bg-ivory/[0.03] p-4">
        <h2 className="text-lg text-ivory">{labels.create}</h2>
        <form onSubmit={createLead} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-xs text-ivory/55">
            {labels.name}
            <input className={inputClass} required maxLength={200} value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-ivory/55">
            {labels.email}
            <input className={inputClass} type="email" required maxLength={320} value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-ivory/55">
            {labels.phone}
            <input className={inputClass} type="tel" maxLength={40} value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-ivory/55">
            {labels.source}
            <input className={inputClass} maxLength={120} value={form.source} onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-ivory/55">
            {labels.owner}
            <select className={inputClass} value={form.ownerId} onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}>
              <option value="">{labels.unassigned}</option>
              {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-5">
            <button type="submit" disabled={busy} className="min-h-10 rounded-full bg-sand px-5 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50">{labels.submit}</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label={labels.import} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importCsv(file);
            }} />
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="min-h-10 rounded-full border border-ivory/20 px-5 text-sm text-ivory/80 transition-colors hover:border-sand hover:text-ivory disabled:opacity-50">{busy ? labels.uploading : labels.import}</button>
            {importSummary ? <span role="status" className="text-sm text-atlas">{importSummary}</span> : null}
            {error ? <span role="alert" className="text-sm text-clay">{error}</span> : null}
            {importErrors.length ? (
              <ul className="basis-full space-y-1 text-xs text-clay" aria-label={labels.rejected}>
                {importErrors.map((item) => <li key={item.row}>{item.row}: {item.error}</li>)}
              </ul>
            ) : null}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-ivory/10">
        <div className="flex flex-wrap gap-2 border-b border-ivory/10 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            aria-label={labels.search}
            className={`${inputClass} min-w-[220px] flex-1`}
          />
          <select value={stage} onChange={(event) => setStage(event.target.value)} aria-label={labels.stage} className={inputClass}>
            <option value="">{labels.allStages}</option>
            {(["LEAD", "CONTACTED", "QUALIFIED", "PROPOSAL", "LOST"] as const).map((value) => <option key={value} value={value}>{stageLabels[value] ?? value}</option>)}
          </select>
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} aria-label={labels.owner} className={inputClass}>
            <option value="">{labels.allOwners}</option>
            {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </div>
        <table className="w-full min-w-[760px] text-start text-sm">
          <thead className="bg-ivory/[0.04] text-xs uppercase tracking-wide text-ivory/45">
            <tr>
              <th className="px-4 py-3 text-start">{labels.name}</th>
              <th className="px-4 py-3 text-start">{labels.email}</th>
              <th className="px-4 py-3 text-start">{labels.source}</th>
              <th className="px-4 py-3 text-start">{labels.owner}</th>
              <th className="px-4 py-3 text-start">{labels.stage}</th>
              <th className="px-4 py-3 text-end">{labels.convert}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory/[0.06]">
            {filteredLeads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ivory/45">{labels.empty}</td></tr>
            ) : filteredLeads.map((lead) => (
              <tr key={lead.id} className="align-middle hover:bg-ivory/[0.03]">
                <td className="px-4 py-3 text-ivory">{lead.fullName}{lead.phone ? <span className="mt-1 block text-xs text-ivory/45">{lead.phone}</span> : null}</td>
                <td className="px-4 py-3 text-ivory/70">{lead.email}</td>
                <td className="px-4 py-3 text-ivory/55">{lead.source ?? "—"}</td>
                <td className="px-4 py-3 text-ivory/55">{lead.owner?.name ?? labels.unassigned}</td>
                <td className="px-4 py-3">
                  {lead.convertedCustomer ? (
                    <StagePill stage="WON" label={stageLabels.WON ?? "WON"} />
                  ) : (
                    <select aria-label={`${labels.stage}: ${lead.fullName}`} disabled={busy} value={lead.stage} onChange={(event) => void updateLead(lead.id, event.target.value)} className={`${inputClass} h-9 text-xs`}>
                      {(["LEAD", "CONTACTED", "QUALIFIED", "PROPOSAL", "LOST"] as const).map((stage) => <option key={stage} value={stage}>{stageLabels[stage] ?? stage}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  {lead.convertedCustomer ? (
                    <Link href={`/admin/crm/clients/${lead.convertedCustomer.id}`} className="text-sand hover:underline">{labels.openCustomer}</Link>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => void convertLead(lead.id)} className="min-h-9 rounded-full border border-sand/40 px-3 text-xs text-sand hover:border-sand disabled:opacity-50">{labels.convert}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
