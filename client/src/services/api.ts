const API_BASE = "/api";

export interface Snippet {
  _id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type SnippetInput = Omit<Snippet, "_id" | "createdAt" | "updatedAt">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const snippetsApi = {
  getAll: () => request<Snippet[]>("/snippets"),
  getById: (id: string) => request<Snippet>(`/snippets/${id}`),
  create: (data: SnippetInput) =>
    request<Snippet>("/snippets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<SnippetInput>) =>
    request<Snippet>(`/snippets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/snippets/${id}`, { method: "DELETE" }),
};
