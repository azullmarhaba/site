export default function AdminLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-56 animate-pulse rounded-lg bg-ivory/[0.07]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-ivory/[0.05]" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-ivory/[0.04]" />
    </div>
  );
}
