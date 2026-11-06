export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-deep">
      <span
        aria-hidden="true"
        className="inline-block size-8 animate-spin rounded-full border-2 border-sand border-t-transparent"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
