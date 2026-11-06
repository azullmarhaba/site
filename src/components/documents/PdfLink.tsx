import { FileText } from "lucide-react";
import type { DocumentKind } from "@/server/services/contracts";

const TONE = {
  solid:
    "bg-sand text-obsidian hover:bg-sand-bright border border-sand",
  outline:
    "border border-ivory/25 text-ivory hover:border-sand hover:text-sand",
} as const;

export function PdfLink({
  kind,
  reference,
  label,
  tone = "outline",
  className = "",
}: {
  kind: DocumentKind;
  reference: string;
  label: string;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <a
      href={`/api/documents/${kind}/${encodeURIComponent(reference)}`}
      target="_blank"
      rel="noopener"
      className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm transition-colors ${TONE[tone]} ${className}`}
    >
      <FileText className="size-4" aria-hidden="true" />
      {label}
    </a>
  );
}
