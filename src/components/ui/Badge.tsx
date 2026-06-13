import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "info" | "warning";
}

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.04] text-zinc-300",
    success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    info: "border-sky-300/20 bg-sky-300/10 text-sky-100",
    warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`} {...props} />;
}
