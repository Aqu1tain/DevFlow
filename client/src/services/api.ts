const API_BASE = "/api";
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

export const authApi = {
  register: (email: string, password: string, username: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  guest: () =>
    request<AuthResponse>("/auth/guest", { method: "POST" }),
  convertGuest: (email: string, password: string, username?: string) =>
    request<AuthResponse>("/auth/guest/convert", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),
  me: () =>
    request<{ user: User }>("/auth/me"),
};
