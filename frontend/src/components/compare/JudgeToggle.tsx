import { Scale } from "lucide-react";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function JudgeToggle({ enabled, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Scale size={16} className="text-[hsl(var(--muted-foreground))]" />
      <span className="text-sm">AI Judge</span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-[hsl(var(--primary))]"
      />
    </label>
  );
}
