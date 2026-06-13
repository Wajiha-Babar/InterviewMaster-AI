import type { ReactNode } from "react";

export function CTABlock({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-300/15 bg-gradient-to-r from-emerald-300/12 via-cyan-300/8 to-white/[0.03] p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{body}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
