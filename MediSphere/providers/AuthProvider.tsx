import React, { createContext, useContext, useEffect, useState } from "react";
import { authFetch, clearToken, getToken, saveToken } from "../lib/auth";
import BASE_URL from "../lib/apiconfig";

type Role = "admin" | "user";
type User = { id: number; username: string; role: Role } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<boolean> => {
    try {
      const res = await authFetch(`${BASE_URL}/auth/me`);
      if (!res.ok) {
        setUser(null);
        return false;
      }
      const json = await res.json();
      setUser(json.user ?? null);
      return !!json.user;
    } catch {
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) await refreshUser();
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token: string) => {
    await saveToken(token);
    await refreshUser(); // updates user state
  };

  const logout = async () => {
    try {
      await authFetch(`${BASE_URL}/auth/logout`, { method: "POST" });
    } catch {}
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
