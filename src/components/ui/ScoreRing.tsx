export function ScoreRing({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(#6ee7b7 ${safe * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-zinc-950">
          <span className="text-2xl font-semibold text-white">{safe}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm text-zinc-500">Local score estimate from AI feedback.</p>
      </div>
    </div>
  );
}
