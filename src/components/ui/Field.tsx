import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type Tone = "dark" | "light";

const CONTROL: Record<Tone, string> = {
  dark: "border-ivory/15 bg-carbon text-ivory placeholder:text-ivory/35 focus:border-sand",
  light:
    "border-black/15 bg-white text-[#16150f] placeholder:text-black/35 focus:border-sand",
};

const LABEL: Record<Tone, string> = {
  dark: "text-ivory/60",
  light: "text-black/55",
};

const ERROR = "text-clay text-xs mt-1.5";

function labelClasses(tone: Tone, className: string) {
  return `block font-mono text-[0.66rem] uppercase tracking-[0.24em] mb-2 ${LABEL[tone]} ${className}`;
}

export function Field({
  id,
  label,
  error,
  hint,
  tone = "dark",
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClasses(tone, "")}>
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className={ERROR}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs opacity-50 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  tone = "dark",
  className = "",
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { tone?: Tone; invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`block w-full rounded-full border px-5 py-3 text-sm outline-none transition-colors ${CONTROL[tone]} ${invalid ? "border-clay" : ""} ${className}`}
      {...rest}
    />
  );
}

export function Textarea({
  tone = "dark",
  className = "",
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone; invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`block w-full rounded-3xl border px-5 py-3.5 text-sm outline-none transition-colors ${CONTROL[tone]} ${invalid ? "border-clay" : ""} ${className}`}
      {...rest}
    />
  );
}

export function Select({
  tone = "dark",
  className = "",
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone; invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`block w-full appearance-none rounded-full border px-5 py-3 text-sm outline-none transition-colors ${CONTROL[tone]} ${invalid ? "border-clay" : ""} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
