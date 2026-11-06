const STAGE_TONES: Record<string, string> = {
  LEAD: "border-atlas/40 bg-atlas/10 text-atlas",
  CONTACTED: "border-sand/40 bg-sand/10 text-sand",
  QUALIFIED: "border-ivory/40 bg-ivory/10 text-ivory",
  PROPOSAL: "border-atlas/40 bg-atlas/10 text-atlas",
  WON: "border-ivory/60 bg-ivory/15 text-ivory",
  LOST: "border-clay/40 bg-clay/10 text-clay",
};

export function StagePill({ stage, label }: { stage: string; label: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
        STAGE_TONES[stage] ?? "border-ivory/25 bg-ivory/10 text-ivory/70"
      }`}
    >
      {label}
    </span>
  );
}