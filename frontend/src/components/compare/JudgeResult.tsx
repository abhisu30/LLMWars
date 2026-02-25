import { Scale, Trophy, Loader2 } from "lucide-react";
import type { JudgeResponse } from "../../api/compare.ts";

interface Props {
  result: JudgeResponse | null;
  loading?: boolean;
}

export function JudgeResult({ result, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">AI Judge is evaluating...</span>
      </div>
    );
  }

  if (!result) return null;

  if (result.error) {
    return (
      <div className="p-4 rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--card))]">
        <p className="text-sm text-[hsl(var(--destructive))]">Judge error: {result.error}</p>
      </div>
    );
  }

  const data = result.result;
  if (!data) return null;

  return (
    <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-3">
      <div className="flex items-center gap-2">
        <Scale size={16} />
        <h3 className="font-semibold text-sm">AI Judge Results</h3>
        {result.latency_ms && (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">({result.latency_ms}ms)</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Trophy size={14} className="text-yellow-500" />
        <span>Winner: <strong>{data.winner}</strong></span>
      </div>

      <p className="text-sm text-[hsl(var(--muted-foreground))]">{data.judge_reasoning}</p>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data.evaluations.length}, 1fr)` }}>
        {data.evaluations.map((ev) => (
          <div key={ev.model_label} className="p-2 rounded border border-[hsl(var(--border))] text-sm">
            <p className="font-medium">{ev.model_label}</p>
            <p>Score: <strong>{ev.score}</strong></p>
            <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">{ev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
