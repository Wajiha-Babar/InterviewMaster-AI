import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" | "success" }) {
  const styles = {
    error: "border-red-400/25 bg-red-500/10 text-red-100",
    info: "border-sky-300/25 bg-sky-400/10 text-sky-100",
    success: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  };
  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${styles[tone]}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
