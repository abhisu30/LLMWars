import { apiFetch } from "./client.ts";

export interface ModelSelection {
  provider: string;
  model: string;
}

export interface LLMResult {
  text: string;
  usage: Record<string, number>;
  model: string;
  provider: string;
  error: string | null;
  latency_ms: number;
  output_id: number;
}

export interface RunResponse {
  run_id: number;
  run_prompt_id: number;
  results: LLMResult[];
}

export interface AutorunStatusResponse {
  run_id: number;
  status: string;
  completed: number;
  total: number;
  prompts: Array<{
    id: number;
    prompt_text: string;
    sequence_num: number;
    outputs: Array<{
      id: number;
      provider: string;
      model: string;
      output_text: string;
      latency_ms: number;
      error: string | null;
    }>;
    scores: Array<{
      model_label: string;
      score: number;
      comment: string;
    }>;
    judge_results: Array<{
      result_json: Record<string, unknown>;
    }>;
  }>;
}

export interface ScoreSubmission {
  model_label: string;
  score: number;
  comment: string;
}

export interface JudgeResponse {
  result?: {
    evaluations: Array<{
      model_label: string;
      score: number;
      comment: string;
    }>;
    winner: string;
    judge_reasoning: string;
  };
  error?: string;
  latency_ms?: number;
}

export function submitRun(prompt: string, models: ModelSelection[], judgeEnabled: boolean) {
  return apiFetch<RunResponse>("/compare/run", {
    method: "POST",
    body: JSON.stringify({ prompt, models, judge_enabled: judgeEnabled }),
  });
}

export function submitAutorun(prompts: string[], models: ModelSelection[], judgeEnabled: boolean) {
  return apiFetch<{ run_id: number; status: string }>("/compare/autorun", {
    method: "POST",
    body: JSON.stringify({ prompts, models, judge_enabled: judgeEnabled }),
  });
}

export function pollAutorunStatus(runId: number) {
  return apiFetch<AutorunStatusResponse>(`/compare/autorun/${runId}/status`);
}

export function submitScore(runPromptId: number, scores: ScoreSubmission[]) {
  return apiFetch<{ status: string }>("/compare/score", {
    method: "POST",
    body: JSON.stringify({ run_prompt_id: runPromptId, scores }),
  });
}

export function invokeJudge(runPromptId: number) {
  return apiFetch<JudgeResponse>("/compare/judge", {
    method: "POST",
    body: JSON.stringify({ run_prompt_id: runPromptId }),
  });
}
