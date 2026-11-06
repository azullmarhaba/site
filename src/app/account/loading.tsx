export default function AccountLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-48 animate-pulse rounded-lg bg-ivory/[0.07]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ivory/[0.05]" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-3xl border border-ivory/10 bg-ivory/[0.04]" />
    </div>
  );
}
