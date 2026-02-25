import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitScore, type ScoreSubmission } from "../../api/compare.ts";

interface Props {
  runPromptId: number;
  modelCount: number;
  modelLabels: string[];
  onScored: () => void;
}

export function ScoringForm({ runPromptId, modelCount, modelLabels, onScored }: Props) {
  const maxScore = modelCount;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: ScoreSubmission[]) => submitScore(runPromptId, data),
    onSuccess: () => onScored(),
  });

  const allFilled = modelLabels.every((label) => scores[label] !== undefined);

  const handleSubmit = () => {
    const data: ScoreSubmission[] = modelLabels.map((label) => ({
      model_label: label,
      score: scores[label],
      comment: comments[label]?.trim() || "not provided",
    }));
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <h3 className="font-semibold text-sm">Score Each Model (required)</h3>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${modelCount}, 1fr)` }}>
        {modelLabels.map((label) => (
          <div key={label} className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <select
              value={scores[label] ?? ""}
              onChange={(e) =>
                setScores((s) => ({ ...s, [label]: Number(e.target.value) }))
              }
              className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
            >
              <option value="">Score</option>
              {Array.from({ length: maxScore }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === maxScore ? "(Best)" : n === 1 ? "(Needs Work)" : ""}
                </option>
              ))}
            </select>
            <textarea
              value={comments[label] || ""}
              onChange={(e) =>
                setComments((c) => ({ ...c, [label]: e.target.value }))
              }
              placeholder="Your feedback (optional)"
              rows={2}
              className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-2 py-1.5 text-sm resize-y"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allFilled || mutation.isPending}
        className="px-4 py-2 rounded-md text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? "Submitting..." : "Submit Scores"}
      </button>

      {mutation.isError && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
