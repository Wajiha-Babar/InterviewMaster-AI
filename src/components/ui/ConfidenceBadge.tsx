import { Badge } from "./Badge";

export function ConfidenceBadge({ value, fallback }: { value: number; fallback?: boolean }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = percent >= 75 ? "success" : percent >= 50 ? "info" : "warning";
  return <Badge tone={tone}>{percent}% confidence{fallback ? " · local fallback" : ""}</Badge>;
}
