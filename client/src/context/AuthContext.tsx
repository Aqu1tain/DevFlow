import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, setToken, getToken, clearToken, type User, type TotpRequired } from "../services/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | TotpRequired | null>;
  register: (email: string, password: string, username: string) => Promise<string | null>;
  loginAsGuest: () => Promise<string | null>;
  loginWithToken: (token: string) => Promise<string | null>;
  verifyTotp: (tempToken: string, code: string) => Promise<string | null>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return void setLoading(false);

    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = async (fn: () => Promise<{ token: string; user: User }>) => {
    try {
      const { token, user } = await fn();
      setToken(token);
      setUser(user);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Something went wrong";
    }
  };

  const login = async (email: string, password: string): Promise<string | TotpRequired | null> => {
    try {
      const res = await authApi.login(email, password);
      if ("requireTotp" in res) return res;
      setToken(res.token);
      setUser(res.user);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Something went wrong";
    }
  };

  const verifyTotp = (tempToken: string, code: string) =>
    handleAuth(() => authApi.verifyTotp(tempToken, code));

  const hydrateUser = async () => {
    const { user } = await authApi.me();
    setUser(user);
  };

  const refreshUser = async () => {
    try { await hydrateUser(); } catch {}
  };

  const register = (email: string, password: string, username: string) =>
    handleAuth(() => authApi.register(email, password, username));

  const loginAsGuest = () => handleAuth(() => authApi.guest());

  const loginWithToken = useCallback(async (token: string) => {
    setToken(token);
    try {
      await hydrateUser();
      return null;
    } catch (err) {
      clearToken();
      return err instanceof Error ? err.message : "Authentication failed";
    }
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, loginAsGuest, loginWithToken, verifyTotp, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
