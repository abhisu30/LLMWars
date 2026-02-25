import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProvider, type Provider } from "../../api/admin.ts";
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react";

interface Props {
  provider: Provider;
}

export function ProviderConfig({ provider }: Props) {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(provider.endpoint || "");
  const [isActive, setIsActive] = useState(provider.is_active);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      updateProvider(provider.name, {
        ...(apiKey ? { api_key: apiKey } : {}),
        endpoint: endpoint || undefined,
        is_active: isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const hasKey = !!provider.api_key;

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-5 bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">{provider.display_name}</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded accent-[hsl(var(--primary))]"
          />
          Active
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">
            API Key{" "}
            {hasKey ? (
              <span className="text-green-500 text-xs">✓ saved ({provider.api_key}) — enter new key to replace</span>
            ) : (
              <span className="text-amber-500 text-xs">not configured</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? "Enter new key to replace" : "Enter API key"}
              className="flex-1 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 rounded-md hover:bg-[hsl(var(--accent))]"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">
            Custom Endpoint (optional)
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Leave empty for default"
            className="w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {mutation.isPending ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>

        {mutation.isError && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            {(mutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
