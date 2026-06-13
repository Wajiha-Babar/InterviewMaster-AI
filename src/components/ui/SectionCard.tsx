import type { ReactNode } from "react";
import { Card } from "./Card";

export function SectionCard({ title, body, action, children, className = "" }: { title: string; body?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          {body && <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{body}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
