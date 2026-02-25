import { useQuery } from "@tanstack/react-query";
import { fetchRunDetail, getExportUrl } from "../../api/runs.ts";
import { CompareGrid } from "../compare/CompareGrid.tsx";
import { Download, FileSpreadsheet } from "lucide-react";

interface Props {
  runId: number;
}

export function RunDetail({ runId }: Props) {
  const { data: run, isLoading } = useQuery({
    queryKey: ["run", runId],
    queryFn: () => fetchRunDetail(runId),
  });

  if (isLoading) return <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>;
  if (!run) return <p className="text-sm text-[hsl(var(--destructive))]">Run not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Run #{run.id}</h3>
        <div className="flex items-center gap-2">
          <a
            href={getExportUrl(runId, "csv")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]"
          >
            <Download size={12} /> CSV
          </a>
          <a
            href={getExportUrl(runId, "xlsx")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]"
          >
            <FileSpreadsheet size={12} /> XLSX
          </a>
        </div>
      </div>

      <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
        <p>Mode: {run.mode} | Status: {run.status} | Judge: {run.judge_enabled ? "Enabled" : "Disabled"}</p>
        <p>Created: {new Date(run.created_at).toLocaleString()}</p>
        <p>Models: {run.models_config.map((m) => `${m.provider}/${m.model}`).join(", ")}</p>
      </div>

      {run.prompts.map((p) => (
        <div key={p.id} className="space-y-3 p-3 rounded-lg border border-[hsl(var(--border))]">
          <p className="text-sm">
            <strong>Prompt {p.sequence_num}:</strong> {p.prompt_text}
          </p>

          {p.outputs.length > 0 && (
            <CompareGrid
              results={p.outputs.map((o) => ({
                text: o.output_text,
                usage: o.usage_data || {},
                model: o.model,
                provider: o.provider,
                error: o.error,
                latency_ms: o.latency_ms,
                output_id: o.id,
              }))}
            />
          )}

          {p.scores.length > 0 && (
            <div className="text-xs space-y-1">
              <p className="font-medium">Scores:</p>
              {p.scores.map((s, i) => (
                <p key={i}>
                  {s.model_label}: <strong>{s.score}</strong> — {s.comment}
                </p>
              ))}
            </div>
          )}

          {p.judge_results.length > 0 && (
            <div className="text-xs space-y-1">
              <p className="font-medium">Judge Result:</p>
              <pre className="bg-[hsl(var(--muted))] p-2 rounded text-xs overflow-auto">
                {JSON.stringify(p.judge_results[0].result_json, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
