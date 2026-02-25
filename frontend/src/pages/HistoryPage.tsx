import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRuns } from "../api/runs.ts";
import { RunsTable } from "../components/history/RunsTable.tsx";
import { RunDetail } from "../components/history/RunDetail.tsx";
import { History } from "lucide-react";

export function HistoryPage() {
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const { data: runs, isLoading, error } = useQuery({
    queryKey: ["runs"],
    queryFn: () => fetchRuns(),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <History size={20} />
        <h1 className="text-xl font-semibold">Run History</h1>
      </div>

      {isLoading && <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading runs...</p>}
      {error && <p className="text-sm text-[hsl(var(--destructive))]">Failed to load runs</p>}

      {runs && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
          <RunsTable runs={runs} onSelect={setSelectedRunId} selectedId={selectedRunId} />
        </div>
      )}

      {selectedRunId && (
        <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <RunDetail runId={selectedRunId} />
        </div>
      )}
    </div>
  );
}
