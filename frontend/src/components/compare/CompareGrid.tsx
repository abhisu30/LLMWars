import { Panel, Group, Separator } from "react-resizable-panels";
import { OutputPanel } from "./OutputPanel.tsx";
import type { LLMResult } from "../../api/compare.ts";

interface Props {
  results: LLMResult[];
}

const LABELS = ["Model A", "Model B", "Model C"];

export function CompareGrid({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="h-[500px]">
      <Group>
        {results.map((result, i) => (
          <div key={i} className="contents">
            {i > 0 && (
              <Separator className="w-1.5 bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary))] transition-colors cursor-col-resize rounded" />
            )}
            <Panel minSize={20}>
              <OutputPanel result={result} label={LABELS[i]} />
            </Panel>
          </div>
        ))}
      </Group>
    </div>
  );
}
