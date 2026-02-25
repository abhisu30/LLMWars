import { Loader2, CheckCircle } from "lucide-react";

interface Props {
  completed: number;
  total: number;
  status: string;
}

export function AutorunProgress({ completed, total, status }: Props) {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} className="text-green-500" />
          )}
          <span>
            {status === "completed" ? "All prompts completed" : `Running prompt ${completed + 1} of ${total}`}
          </span>
        </div>
        <span className="text-[hsl(var(--muted-foreground))]">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
