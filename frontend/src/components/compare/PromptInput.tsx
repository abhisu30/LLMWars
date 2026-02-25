interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PromptInput({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Prompt</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter your prompt here..."
        rows={4}
        className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm resize-y disabled:opacity-50"
      />
    </div>
  );
}
