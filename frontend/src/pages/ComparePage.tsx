import { useState } from "react";
import { ModelSelector } from "../components/compare/ModelSelector.tsx";
import { PromptInput } from "../components/compare/PromptInput.tsx";
import { CompareGrid } from "../components/compare/CompareGrid.tsx";
import { ScoringForm } from "../components/compare/ScoringForm.tsx";
import { JudgeToggle } from "../components/compare/JudgeToggle.tsx";
import { JudgeResult } from "../components/compare/JudgeResult.tsx";
import { PromptListInput } from "../components/autorun/PromptListInput.tsx";
import { AutorunProgress } from "../components/autorun/AutorunProgress.tsx";
import { useCompare } from "../hooks/useCompare.ts";
import { useAutorun } from "../hooks/useAutorun.ts";
import { invokeJudge, type ModelSelection, type LLMResult, type JudgeResponse } from "../api/compare.ts";
import { Play, ArrowRight, Loader2 } from "lucide-react";

const MODEL_LABELS = ["Model A", "Model B", "Model C"];

export function ComparePage() {
  // Mode
  const [mode, setMode] = useState<"single" | "autorun">("single");

  // Model selection
  const [model1, setModel1] = useState<ModelSelection | null>(null);
  const [model2, setModel2] = useState<ModelSelection | null>(null);
  const [model3, setModel3] = useState<ModelSelection | null>(null);

  // Prompt
  const [prompt, setPrompt] = useState("");
  const [autorunPrompts, setAutorunPrompts] = useState<string[]>([""]);

  // Judge
  const [judgeEnabled, setJudgeEnabled] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeResponse | null>(null);
  const [judgeLoading, setJudgeLoading] = useState(false);

  // Results
  const [results, setResults] = useState<LLMResult[]>([]);
  const [runPromptId, setRunPromptId] = useState<number | null>(null);
  const [scored, setScored] = useState(false);

  // Autorun
  const autorun = useAutorun();

  // Single run
  const compareMutation = useCompare();

  const selectedModels = [model1, model2, model3].filter(Boolean) as ModelSelection[];
  const modelCount = selectedModels.length;
  const labels = MODEL_LABELS.slice(0, modelCount);

  const canRun =
    modelCount >= 2 &&
    (mode === "single" ? prompt.trim() : autorunPrompts.some((p) => p.trim()));

  const isRunning = compareMutation.isPending || autorun.isRunning;

  const handleRun = async () => {
    setResults([]);
    setRunPromptId(null);
    setScored(false);
    setJudgeResult(null);

    if (mode === "single") {
      const res = await compareMutation.mutateAsync({
        prompt: prompt.trim(),
        models: selectedModels,
        judgeEnabled,
      });
      setResults(res.results);
      setRunPromptId(res.run_prompt_id);

      if (judgeEnabled) {
        setJudgeLoading(true);
        try {
          const jr = await invokeJudge(res.run_prompt_id);
          setJudgeResult(jr);
        } catch {
          setJudgeResult({ error: "Failed to invoke judge" });
        }
        setJudgeLoading(false);
      }
    } else {
      const validPrompts = autorunPrompts.filter((p) => p.trim());
      autorun.start(validPrompts, selectedModels, judgeEnabled);
    }
  };

  const handleScored = () => setScored(true);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("single")}
          className={`px-3 py-1.5 rounded-md text-sm ${mode === "single" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"}`}
        >
          Single Prompt
        </button>
        <button
          onClick={() => setMode("autorun")}
          className={`px-3 py-1.5 rounded-md text-sm ${mode === "autorun" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"}`}
        >
          Autorun
        </button>
      </div>

      {/* Model Selection */}
      <div className="space-y-2 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <h2 className="text-sm font-semibold mb-2">Select Models</h2>
        <ModelSelector label="Model 1" value={model1} onChange={setModel1} />
        <ModelSelector label="Model 2" value={model2} onChange={setModel2} />
        <ModelSelector label="Model 3" value={model3} onChange={setModel3} optional />
      </div>

      {/* Prompt Input */}
      <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {mode === "single" ? (
          <PromptInput value={prompt} onChange={setPrompt} disabled={isRunning} />
        ) : (
          <PromptListInput prompts={autorunPrompts} onChange={setAutorunPrompts} disabled={isRunning} />
        )}

        <div className="flex items-center justify-between mt-3">
          <JudgeToggle enabled={judgeEnabled} onChange={setJudgeEnabled} />
          <button
            onClick={handleRun}
            disabled={!canRun || isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
          >
            {isRunning ? (
              <><Loader2 size={16} className="animate-spin" /> Running...</>
            ) : (
              <><Play size={16} /> {mode === "single" ? "Run" : "Run All"}</>
            )}
          </button>
        </div>
      </div>

      {/* Autorun Progress */}
      {mode === "autorun" && autorun.status && (
        <AutorunProgress
          completed={autorun.status.completed}
          total={autorun.status.total}
          status={autorun.status.status}
        />
      )}

      {/* Error Display */}
      {compareMutation.isError && (
        <div className="p-3 rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--card))] text-sm text-[hsl(var(--destructive))]">
          {(compareMutation.error as Error).message}
        </div>
      )}
      {autorun.error && (
        <div className="p-3 rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--card))] text-sm text-[hsl(var(--destructive))]">
          {autorun.error}
        </div>
      )}

      {/* Single Mode Results */}
      {mode === "single" && results.length > 0 && (
        <>
          <CompareGrid results={results} />

          {/* Judge Result */}
          <JudgeResult result={judgeResult} loading={judgeLoading} />

          {/* Scoring */}
          {!scored && runPromptId && (
            <ScoringForm
              runPromptId={runPromptId}
              modelCount={modelCount}
              modelLabels={labels}
              onScored={handleScored}
            />
          )}
          {scored && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-600 dark:text-green-400">
              <ArrowRight size={16} />
              Scores submitted successfully!
            </div>
          )}
        </>
      )}

      {/* Autorun Results */}
      {mode === "autorun" && autorun.status?.prompts?.map((p) => (
        <div key={p.id} className="space-y-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <p className="text-sm font-medium">
            Prompt {p.sequence_num}: <span className="font-normal text-[hsl(var(--muted-foreground))]">{p.prompt_text}</span>
          </p>
          {p.outputs?.length > 0 && (
            <CompareGrid
              results={p.outputs.map((o) => ({
                text: o.output_text,
                usage: {},
                model: o.model,
                provider: o.provider,
                error: o.error,
                latency_ms: o.latency_ms,
                output_id: o.id,
              }))}
            />
          )}
        </div>
      ))}
    </div>
  );
}
