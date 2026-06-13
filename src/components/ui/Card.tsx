import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className = "", elevated = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-zinc-950/72 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur ${elevated ? "bg-gradient-to-b from-white/[0.07] to-white/[0.025]" : ""} ${className}`}
      {...props}
    />
  );
}
