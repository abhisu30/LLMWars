import { useMutation } from "@tanstack/react-query";
import { submitRun, type ModelSelection, type RunResponse } from "../api/compare.ts";

export function useCompare() {
  return useMutation<
    RunResponse,
    Error,
    { prompt: string; models: ModelSelection[]; judgeEnabled: boolean }
  >({
    mutationFn: ({ prompt, models, judgeEnabled }) =>
      submitRun(prompt, models, judgeEnabled),
  });
}
