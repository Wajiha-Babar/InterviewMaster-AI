import { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3.5 py-2.5 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 hover:border-white/16 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/10 ${className}`}
      {...props}
    />
  );
}
