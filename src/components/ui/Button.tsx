import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "dark"
  | "outline-dark"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-sand text-obsidian hover:bg-sand-bright shadow-[0_14px_34px_-16px_rgba(200,155,109,0.7)]",
  outline:
    "border border-ivory/30 bg-ivory/5 text-ivory backdrop-blur-sm hover:border-sand hover:text-sand",
  ghost: "text-ivory/80 hover:text-sand",
  dark: "bg-obsidian text-ivory hover:bg-deep",
  "outline-dark":
    "border border-obsidian/25 text-obsidian hover:border-sand hover:text-clay",
  danger: "bg-clay text-white hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[0.95rem]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = ""
): string {
  return [BASE, VARIANTS[variant], SIZES[size], className].join(" ");
}

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: SharedProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
