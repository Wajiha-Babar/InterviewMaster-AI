export function PageHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{eyebrow}</p>
      <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
      {body && <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{body}</p>}
    </div>
  );
}
