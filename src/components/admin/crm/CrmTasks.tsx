"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = {
  followUps: string;
  newTask: string;
  taskPlaceholder: string;
  assignee: string;
  due: string;
  open: string;
  done: string;
  noTasks: string;
  unassigned: string;
};

type Item = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  assigneeName: string | null;
};

export function CrmTasks({
  customerId,
  items,
  staff,
  labels,
  locale,
}: {
  customerId: string;
  items: Item[];
  staff: { id: string; name: string }[];
  labels: Labels;
  locale: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/crm/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, title, dueAt: dueAt || null, assigneeId: assigneeId || null }),
      });
      if (res.ok) {
        setTitle("");
        setDueAt("");
        setAssigneeId("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string, status: string) => {
    await fetch(`/api/admin/crm/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "DONE" ? "OPEN" : "DONE" }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/crm/tasks/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const fmtDue = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={labels.taskPlaceholder}
          className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory placeholder:text-ivory/35 focus:border-sand/60 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-xs text-ivory/50">
          {labels.due}
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-lg border border-ivory/15 bg-deep px-2 py-2 text-sm text-ivory focus:border-sand/60 focus:outline-none"
          />
        </label>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          aria-label={labels.assignee}
          className="rounded-lg border border-ivory/15 bg-deep px-2 py-2 text-sm text-ivory/80 focus:border-sand/60 focus:outline-none"
        >
          <option value="">{labels.unassigned}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-lg bg-sand px-4 py-2 text-sm font-medium text-obsidian hover:brightness-110 disabled:opacity-40"
        >
          {labels.newTask}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-ivory/45">{labels.noTasks}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ivory/10 bg-ivory/[0.03] px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => void toggle(t.id, t.status)}
                className={`flex min-w-0 items-center gap-2 text-start text-sm ${
                  t.status === "DONE" ? "text-ivory/40 line-through" : "text-ivory"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border ${
                    t.status === "DONE" ? "border-sand bg-sand/40" : "border-ivory/30"
                  }`}
                />
                <span className="truncate">{t.title}</span>
              </button>
              <div className="flex shrink-0 items-center gap-3 text-xs text-ivory/45">
                {t.dueAt ? <span>{fmtDue(t.dueAt)}</span> : null}
                {t.assigneeName ? <span>{t.assigneeName}</span> : null}
                <span
                  className={`font-mono text-[0.55rem] uppercase tracking-[0.16em] ${
                    t.status === "DONE" ? "text-sand/70" : "text-ivory/40"
                  }`}
                >
                  {t.status === "DONE" ? labels.done : labels.open}
                </span>
                <button
                  type="button"
                  onClick={() => void remove(t.id)}
                  className="text-ivory/30 hover:text-clay"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}