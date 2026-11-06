"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center rounded-full border border-ivory/25 px-6 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
    >
      {label}
    </button>
  );
}
