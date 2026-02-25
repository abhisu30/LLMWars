import { useQuery } from "@tanstack/react-query";
import { fetchProviders } from "../api/admin.ts";
import { ProviderConfig } from "../components/admin/ProviderConfig.tsx";
import { JudgeConfig } from "../components/admin/JudgeConfig.tsx";
import { Settings } from "lucide-react";

export function AdminPage() {
  const { data: providers, isLoading, error } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">Provider Configuration</h2>
        {isLoading && <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading providers...</p>}
        {error && <p className="text-sm text-[hsl(var(--destructive))]">Failed to load providers</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {providers?.map((provider) => (
            <ProviderConfig key={provider.name} provider={provider} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Judge Settings</h2>
        <JudgeConfig />
      </section>
    </div>
  );
}
