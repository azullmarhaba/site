import type { ReactNode } from "react";

export function StatsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ivory/10 bg-ivory/[0.04] p-5">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ivory md:text-4xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ivory/45">{hint}</p> : null}
    </div>
  );
}

export function AdminPanel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-ivory/10 bg-ivory/[0.03] ${className}`}
    >
      {title || action ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/10 px-5 py-4">
          {title ? <h2 className="text-base font-medium text-ivory md:text-lg">{title}</h2> : null}
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminTable({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`border-b border-ivory/10 px-4 py-3 text-start font-mono text-[0.58rem] font-normal uppercase tracking-[0.18em] text-ivory/45 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-ivory/[0.06] px-4 py-3 align-top ${className}`}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-ivory/45">
        {message}
      </td>
    </tr>
  );
}
