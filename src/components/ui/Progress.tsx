export function Progress({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{label}</span>
          <span className="font-medium text-zinc-300">{safeValue}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
