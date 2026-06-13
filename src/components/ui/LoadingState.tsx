import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-300">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
