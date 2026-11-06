"use client";

import type { ReactNode } from "react";

export function AuthCard({
  title,
  lead,
  error,
  success,
  children,
  footer,
}: {
  title: string;
  lead?: string;
  error?: string | null;
  success?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-ivory/10 bg-deep p-7 md:p-9">
      <h1 className="font-display text-2xl md:text-3xl">{title}</h1>
      {lead ? <p className="mt-2 text-sm leading-relaxed text-ivory/60">{lead}</p> : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="mt-5 rounded-2xl border border-sand/40 bg-sand/10 px-4 py-3 text-sm text-sand"
        >
          {success}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">{children}</div>
      {footer ? (
        <div className="mt-6 border-t border-ivory/10 pt-5 text-center text-sm text-ivory/60">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
