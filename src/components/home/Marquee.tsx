export function Marquee({ text }: { text: string }) {
  const phrase = ` ${text} · `;
  return (
    <div
      className="overflow-hidden border-y border-ivory/10 bg-deep py-4 select-none"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max gap-4 whitespace-nowrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="font-display text-xl tracking-[0.25em] text-ivory/35 md:text-2xl"
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}
