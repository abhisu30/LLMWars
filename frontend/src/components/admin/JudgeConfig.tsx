import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProviders, fetchSettings, updateSettings, fetchModels, type ModelInfo } from "../../api/admin.ts";
import { Save, CheckCircle } from "lucide-react";

export function JudgeConfig() {
  const queryClient = useQueryClient();
  const { data: providers } = useQuery({ queryKey: ["providers"], queryFn: fetchProviders });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [judgeProvider, setJudgeProvider] = useState("");
  const [judgeModel, setJudgeModel] = useState("");
  const [judgeAdditionalInstruction, setJudgeAdditionalInstruction] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setJudgeProvider(settings.judge_provider || "");
      setJudgeModel(settings.judge_model || "");
      setJudgeAdditionalInstruction(settings.judge_additional_instruction || "");
    }
  }, [settings]);

  useEffect(() => {
    if (judgeProvider) {
      fetchModels(judgeProvider).then(setModels);
    }
  }, [judgeProvider]);

  const mutation = useMutation({
    mutationFn: () =>
      updateSettings({
        judge_provider: judgeProvider,
        judge_model: judgeModel,
        judge_additional_instruction: judgeAdditionalInstruction,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const activeProviders = providers?.filter((p) => p.is_active && p.api_key) || [];

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-5 bg-[hsl(var(--card))]">
      <h3 className="font-semibold text-base mb-4">AI Judge Configuration</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">
            Judge Provider
          </label>
          <select
            value={judgeProvider}
            onChange={(e) => {
              setJudgeProvider(e.target.value);
              setJudgeModel("");
            }}
            className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            <option value="">Select provider</option>
            {activeProviders.map((p) => (
              <option key={p.name} value={p.name}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">
            Judge Model
          </label>
          <select
            value={judgeModel}
            onChange={(e) => setJudgeModel(e.target.value)}
            className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
            disabled={!judgeProvider}
          >
            <option value="">Select model</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">
            Additional Instruction <span className="text-xs opacity-60">(optional)</span>
          </label>
          <textarea
            value={judgeAdditionalInstruction}
            onChange={(e) => setJudgeAdditionalInstruction(e.target.value)}
            placeholder="e.g. Prioritize conciseness. Penalize responses that repeat the question."
            rows={3}
            className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-y"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Appended to the judge prompt as a high-priority instruction. Leave blank to use the default prompt as-is.
          </p>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !judgeProvider || !judgeModel}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {mutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Judge Settings"}
        </button>
      </div>
    </div>
  );
}
