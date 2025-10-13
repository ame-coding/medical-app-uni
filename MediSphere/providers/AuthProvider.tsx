import React, { createContext, useContext, useEffect, useState } from "react";
import { authFetch, clearToken } from "../lib/auth";

type Role = "admin" | "user";
type User = { username: string; role: Role } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

const BASE = "http://192.168.1.100:4000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${BASE}/me`);
      if (!r.ok) {
        setUser(null);
        return;
      }
      const data = await r.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authFetch(`${BASE}/logout`, { method: "POST" }); } catch {}
    await clearToken();
    setUser(null);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
