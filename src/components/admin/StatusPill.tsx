const TONES: Record<string, string> = {
  PENDING: "border-sand/40 bg-sand/10 text-sand",
  CONFIRMED: "border-atlas/40 bg-atlas/10 text-atlas",
  PAID: "border-atlas/40 bg-atlas/10 text-atlas",
  IN_PROGRESS: "border-sand/40 bg-sand/10 text-sand",
  NEW: "border-sand/40 bg-sand/10 text-sand",
  PUBLISHED: "border-atlas/40 bg-atlas/10 text-atlas",
  APPROVED: "border-atlas/40 bg-atlas/10 text-atlas",
  ACTIVE: "border-atlas/40 bg-atlas/10 text-atlas",
  RESOLVED: "border-atlas/40 bg-atlas/10 text-atlas",
  COMPLETED: "border-ivory/25 bg-ivory/10 text-ivory/70",
  DRAFT: "border-ivory/25 bg-ivory/10 text-ivory/70",
  ARCHIVED: "border-ivory/25 bg-ivory/10 text-ivory/50",
  CANCELLED: "border-clay/40 bg-clay/10 text-clay",
  REFUNDED: "border-clay/40 bg-clay/10 text-clay",
  REJECTED: "border-clay/40 bg-clay/10 text-clay",
  FAILED: "border-clay/40 bg-clay/10 text-clay",
  EXPIRED: "border-clay/40 bg-clay/10 text-clay",
  INACTIVE: "border-ivory/25 bg-ivory/10 text-ivory/50",
  SUCCEEDED: "border-atlas/40 bg-atlas/10 text-atlas",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
        TONES[status] ?? "border-ivory/25 bg-ivory/10 text-ivory/70"
      }`}
    >
      {status}
    </span>
  );
}
