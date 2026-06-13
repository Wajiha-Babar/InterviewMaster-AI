export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
    </div>
  );
}
