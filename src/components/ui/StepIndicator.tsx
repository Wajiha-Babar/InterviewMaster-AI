export function StepIndicator({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {steps.map((step, index) => {
        const active = index === activeIndex;
        const complete = index < activeIndex;
        return (
          <div key={step} className={`rounded-lg border p-3 ${active ? "border-emerald-300/30 bg-emerald-300/10" : complete ? "border-white/10 bg-white/[0.045]" : "border-white/[0.07] bg-white/[0.02]"}`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${active || complete ? "bg-emerald-300 text-zinc-950" : "bg-zinc-900 text-zinc-500"}`}>
                {index + 1}
              </span>
              <span className={`text-sm font-medium ${active ? "text-white" : "text-zinc-400"}`}>{step}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
