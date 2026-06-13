import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({ label, value, helper, icon }: { label: string; value: string | number; helper?: string; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        {icon && <div className="text-emerald-200">{icon}</div>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
    </Card>
  );
}
