import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({ className = "", variant = "primary", size = "md", icon, children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-emerald-300 text-zinc-950 shadow-[0_12px_30px_rgba(16,185,129,0.18)] hover:bg-emerald-200 active:bg-emerald-400",
    secondary: "border border-white/10 bg-white/[0.045] text-zinc-100 hover:border-white/18 hover:bg-white/[0.075]",
    ghost: "bg-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white",
    subtle: "bg-zinc-900/70 text-zinc-200 hover:bg-zinc-850",
    danger: "border border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/16",
  };
  const sizes = {
    sm: "min-h-9 px-3 py-1.5 text-xs",
    md: "min-h-10 px-4 py-2 text-sm",
    lg: "min-h-12 px-5 py-3 text-base",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
