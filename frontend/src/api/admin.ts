import { apiFetch } from "./client.ts";

export interface Provider {
  id: number;
  name: string;
  display_name: string;
  api_key: string | null;
  endpoint: string | null;
  is_active: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export function fetchProviders() {
  return apiFetch<Provider[]>("/admin/providers");
}

export function updateProvider(
  name: string,
  data: { api_key?: string; endpoint?: string; is_active?: boolean }
) {
  return apiFetch<{ status: string }>(`/admin/providers/${name}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchSettings() {
  return apiFetch<Record<string, string>>("/admin/settings");
}

export function updateSettings(data: Record<string, string>) {
  return apiFetch<{ status: string }>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchModels(provider: string) {
  return apiFetch<ModelInfo[]>(`/admin/models/${provider}`);
}
