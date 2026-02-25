import { Plus, X } from "lucide-react";

interface Props {
  prompts: string[];
  onChange: (prompts: string[]) => void;
  disabled?: boolean;
}

export function PromptListInput({ prompts, onChange, disabled }: Props) {
  const addPrompt = () => {
    if (prompts.length < 10) {
      onChange([...prompts, ""]);
    }
  };

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      onChange(prompts.filter((_, i) => i !== index));
    }
  };

  const updatePrompt = (index: number, value: string) => {
    const updated = [...prompts];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Prompts ({prompts.length}/10)</label>
        <button
          onClick={addPrompt}
          disabled={disabled || prompts.length >= 10}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-[hsl(var(--accent))] disabled:opacity-50"
        >
          <Plus size={14} /> Add Prompt
        </button>
      </div>
      {prompts.map((prompt, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-xs font-medium mt-2.5 w-5 text-[hsl(var(--muted-foreground))]">
            {i + 1}.
          </span>
          <textarea
            value={prompt}
            onChange={(e) => updatePrompt(i, e.target.value)}
            disabled={disabled}
            placeholder={`Prompt ${i + 1}`}
            rows={2}
            className="flex-1 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm resize-y disabled:opacity-50"
          />
          {prompts.length > 1 && (
            <button
              onClick={() => removePrompt(i)}
              disabled={disabled}
              className="mt-1.5 p-1 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
