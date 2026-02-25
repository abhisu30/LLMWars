import { Trash2, Download, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRun, getExportUrl, type RunSummary } from "../../api/runs.ts";

interface Props {
  runs: RunSummary[];
  onSelect: (runId: number) => void;
  selectedId: number | null;
}

export function RunsTable({ runs, onSelect, selectedId }: Props) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["runs"] }),
  });

  if (runs.length === 0) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))] py-8 text-center">
        No runs yet. Go to Compare to start!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))]">
            <th className="text-left py-2 px-3 font-medium">Date</th>
            <th className="text-left py-2 px-3 font-medium">Mode</th>
            <th className="text-left py-2 px-3 font-medium">Models</th>
            <th className="text-left py-2 px-3 font-medium">Status</th>
            <th className="text-right py-2 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              className={`border-b border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--muted))] ${
                selectedId === run.id ? "bg-[hsl(var(--accent))]" : ""
              }`}
              onClick={() => onSelect(run.id)}
            >
              <td className="py-2 px-3 text-xs">
                {new Date(run.created_at).toLocaleString()}
              </td>
              <td className="py-2 px-3">
                <span className="px-2 py-0.5 rounded text-xs bg-[hsl(var(--muted))]">
                  {run.mode}
                </span>
              </td>
              <td className="py-2 px-3 text-xs">
                {run.models_config.map((m) => `${m.model}`).join(", ")}
              </td>
              <td className="py-2 px-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    run.status === "completed"
                      ? "bg-green-500/15 text-green-600"
                      : run.status === "failed"
                        ? "bg-red-500/15 text-red-600"
                        : "bg-yellow-500/15 text-yellow-600"
                  }`}
                >
                  {run.status}
                </span>
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelect(run.id)}
                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))]"
                    title="View details"
                  >
                    <Eye size={14} />
                  </button>
                  <a
                    href={getExportUrl(run.id, "csv")}
                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))]"
                    title="Export CSV"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(run.id)}
                    className="p-1.5 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))]"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
