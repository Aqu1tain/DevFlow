import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "accent";

const base = "cursor-pointer text-xs font-mono rounded-none transition-colors disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-emerald-500 hover:bg-emerald-400 text-black",
  ghost: "text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20",
  danger: "text-gray-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30",
  accent: "text-emerald-400 hover:text-black hover:bg-emerald-400 border border-emerald-400/30",
};

export const buttonClass = (variant: Variant = "primary", className = "") =>
  `${base} ${variants[variant]} ${className}`;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
