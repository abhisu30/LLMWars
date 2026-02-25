import { apiFetch } from "./client.ts";

export interface RunSummary {
  id: number;
  mode: string;
  judge_enabled: boolean;
  models_config: Array<{ provider: string; model: string }>;
  status: string;
  created_at: string;
}

export interface RunDetail extends RunSummary {
  prompts: Array<{
    id: number;
    prompt_text: string;
    sequence_num: number;
    outputs: Array<{
      id: number;
      provider: string;
      model: string;
      output_text: string;
      usage_data: Record<string, number> | null;
      latency_ms: number;
      error: string | null;
    }>;
    scores: Array<{
      model_label: string;
      score: number;
      comment: string;
    }>;
    judge_results: Array<{
      judge_provider: string;
      judge_model: string;
      result_json: Record<string, unknown>;
      latency_ms: number;
    }>;
  }>;
}

export function fetchRuns(limit = 50, offset = 0) {
  return apiFetch<RunSummary[]>(`/runs/?limit=${limit}&offset=${offset}`);
}

export function fetchRunDetail(runId: number) {
  return apiFetch<RunDetail>(`/runs/${runId}`);
}

export function deleteRun(runId: number) {
  return apiFetch<{ status: string }>(`/runs/${runId}`, { method: "DELETE" });
}

export function getExportUrl(runId: number, format: "csv" | "xlsx") {
  return `/api/runs/${runId}/export?format=${format}`;
}
