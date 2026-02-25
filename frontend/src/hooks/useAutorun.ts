import { useState, useEffect, useCallback } from "react";
import { submitAutorun, pollAutorunStatus, type ModelSelection, type AutorunStatusResponse } from "../api/compare.ts";

export function useAutorun() {
  const [runId, setRunId] = useState<number | null>(null);
  const [status, setStatus] = useState<AutorunStatusResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (prompts: string[], models: ModelSelection[], judgeEnabled: boolean) => {
      setError(null);
      setIsRunning(true);
      try {
        const res = await submitAutorun(prompts, models, judgeEnabled);
        setRunId(res.run_id);
      } catch (e) {
        setError((e as Error).message);
        setIsRunning(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!runId || !isRunning) return;

    const interval = setInterval(async () => {
      try {
        const s = await pollAutorunStatus(runId);
        setStatus(s);
        if (s.status === "completed" || s.status === "failed") {
          setIsRunning(false);
          clearInterval(interval);
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [runId, isRunning]);

  return { start, status, isRunning, error, runId };
}
