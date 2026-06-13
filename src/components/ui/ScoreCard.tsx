export function ScoreCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}
