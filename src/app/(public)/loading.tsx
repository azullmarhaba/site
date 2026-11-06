export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-deep pt-28" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="container-azul space-y-8 py-10">
        <div className="h-[46vh] animate-pulse rounded-3xl bg-ivory/[0.06]" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-ivory/[0.06]" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-3xl bg-ivory/[0.06]" />
      </div>
    </div>
  );
}
