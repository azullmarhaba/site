"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["CUSTOMER", "GUIDE", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"] as const;

export function RoleToggles({
  userId,
  activeRoles,
  labels,
}: {
  userId: string;
  activeRoles: string[];
  labels: { roles: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [active, setActive] = useState<string[]>(activeRoles);

  async function toggle(role: string) {
    setBusy(role);
    try {
      const res = await fetch("/api/admin/misc?kind=role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const nowActive = data?.data?.active;
        if (typeof nowActive === "boolean") {
          setActive((prev) =>
            nowActive ? [...prev, role] : prev.filter((r) => r !== role)
          );
        } else {
          setActive((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
          );
        }
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={labels.roles}>
      {ROLES.map((role) => {
        const on = active.includes(role);
        return (
          <button
            key={role}
            type="button"
            disabled={busy !== null}
            aria-pressed={on}
            onClick={() => toggle(role)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
              on
                ? "border-sand bg-sand/15 text-sand"
                : "border-ivory/15 text-ivory/45 hover:border-ivory/40"
            }`}
          >
            {busy === role ? "…" : role}
          </button>
        );
      })}
    </div>
  );
}
