export const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "devflow_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export interface User {
  id: string;
  email?: string;
  username: string;
  userType: "guest" | "free" | "pro";
  role: string;
  isGuest: boolean;
  guestExpiresAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type Visibility = "public" | "unlisted" | "private";

export interface Snippet {
  _id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  visibility: Visibility;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type SnippetInput = Omit<Snippet, "_id" | "createdAt" | "updatedAt" | "userId">;

export interface AdminSnippet extends Omit<Snippet, "userId"> {
  userId: { _id: string; username: string };
}

export interface AdminStats {
  snippets: { total: number; public: number; unlisted: number; private: number; languages: { name: string; count: number }[] };
  users: { total: number; free: number; pro: number };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

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

export interface Comment {
  _id: string;
  snippetId: string;
  userId: { _id: string; username: string };
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const commentsApi = {
  getAll: (snippetId: string) =>
    request<Comment[]>(`/snippets/${snippetId}/comments`),
  create: (snippetId: string, body: string) =>
    request<Comment>(`/snippets/${snippetId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  delete: (snippetId: string, commentId: string) =>
    request<{ message: string }>(`/snippets/${snippetId}/comments/${commentId}`, {
      method: "DELETE",
    }),
};

export interface Snapshot {
  _id: string;
  snippetId: string;
  userId: string;
  name: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: string;
}

export const snapshotsApi = {
  getAll: (snippetId: string) =>
    request<Snapshot[]>(`/snippets/${snippetId}/snapshots`),
  getById: (snippetId: string, snapshotId: string) =>
    request<Snapshot>(`/snippets/${snippetId}/snapshots/${snapshotId}`),
  create: (snippetId: string, name: string) =>
    request<Snapshot>(`/snippets/${snippetId}/snapshots`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  restore: (snippetId: string, snapshotId: string) =>
    request<Snippet>(`/snippets/${snippetId}/snapshots/${snapshotId}/restore`, {
      method: "POST",
    }),
  delete: (snippetId: string, snapshotId: string) =>
    request<{ message: string }>(`/snippets/${snippetId}/snapshots/${snapshotId}`, {
      method: "DELETE",
    }),
};

function post<T>(path: string, body?: object) {
  return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export const adminApi = {
  getStats: () => request<AdminStats>("/admin/stats"),
  getSnippets: () => request<AdminSnippet[]>("/admin/snippets"),
  deleteSnippet: (id: string) => request<{ message: string }>(`/admin/snippets/${id}`, { method: "DELETE" }),

};

export const authApi = {
  register: (email: string, password: string, username: string) =>
    post<AuthResponse>("/auth/register", { email, password, username }),
  login: (email: string, password: string) =>
    post<AuthResponse>("/auth/login", { email, password }),
  guest: () =>
    post<AuthResponse>("/auth/guest"),
  convertGuest: (email: string, password: string, username?: string) =>
    post<AuthResponse>("/auth/guest/convert", { email, password, username }),
  me: () =>
    request<{ user: User }>("/auth/me"),
};
