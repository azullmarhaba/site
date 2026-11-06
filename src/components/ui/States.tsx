import type { ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-5 animate-spin rounded-full border-2 border-sand border-t-transparent ${className}`}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ivory/15 px-6 py-14 text-center">
      {icon ? <div className="text-sand/70">{icon}</div> : null}
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="max-w-sm text-sm opacity-60">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-sand/40 bg-sand/10 text-ivory",
    success: "border-atlas/60 bg-atlas/15 text-ivory",
    error: "border-clay/60 bg-clay/15 text-ivory",
    warning: "border-sand/60 bg-sand/15 text-ivory",
  } as const;
  return (
    <div role="status" className={`rounded-2xl border px-5 py-4 text-sm ${tones[tone]}`}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      <div className="opacity-85">{children}</div>
    </div>
  );
}
