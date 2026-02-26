import { Clock, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LLMResult } from "../../api/compare.ts";

interface Props {
  result: LLMResult;
  label: string;
}

export function OutputPanel({ result, label }: Props) {
  return (
    <div className="flex flex-col h-full border border-[hsl(var(--border))] rounded-lg overflow-hidden bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            {label}
          </span>
          <span className="text-sm font-medium">
            {result.provider}/{result.model}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Clock size={12} />
          {result.latency_ms}ms
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {result.error ? (
          <div className="flex items-start gap-2 text-[hsl(var(--destructive))]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="text-sm">{result.error}</p>
          </div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
