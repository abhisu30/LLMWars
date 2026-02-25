import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders, fetchModels, type ModelInfo } from "../../api/admin.ts";
import type { ModelSelection } from "../../api/compare.ts";

interface Props {
  label: string;
  value: ModelSelection | null;
  onChange: (selection: ModelSelection | null) => void;
  optional?: boolean;
}

export function ModelSelector({ label, value, onChange, optional }: Props) {
  const { data: providers } = useQuery({ queryKey: ["providers"], queryFn: fetchProviders });
  const [selectedProvider, setSelectedProvider] = useState(value?.provider || "");
  const [models, setModels] = useState<ModelInfo[]>([]);

  const activeProviders = providers?.filter((p) => p.is_active && p.api_key) || [];

  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider).then(setModels);
    } else {
      setModels([]);
    }
  }, [selectedProvider]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium w-20 shrink-0">{label}</span>
      <select
        value={selectedProvider}
        onChange={(e) => {
          setSelectedProvider(e.target.value);
          onChange(null);
        }}
        className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm flex-1"
      >
        <option value="">{optional ? "None (optional)" : "Select provider"}</option>
        {activeProviders.map((p) => (
          <option key={p.name} value={p.name}>{p.display_name}</option>
        ))}
      </select>
      <select
        value={value?.model || ""}
        onChange={(e) =>
          e.target.value
            ? onChange({ provider: selectedProvider, model: e.target.value })
            : onChange(null)
        }
        disabled={!selectedProvider}
        className="rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm flex-1 disabled:opacity-50"
      >
        <option value="">Select model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
}
