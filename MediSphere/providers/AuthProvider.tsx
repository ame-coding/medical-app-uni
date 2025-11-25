// MediSphere/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { authFetch, clearToken, getToken, saveToken } from "../lib/auth";
import BASE_URL from "../lib/apiconfig";

type Role = "admin" | "user";

type User = {
  id: number;
  username: string;
  role: Role;
  // optional fields that may exist on user object returned by backend
  avatar?: string | null;
  avatar_url?: string | null;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  // profile update notifier:
  lastProfileUpdate: number; // timestamp (ms) that increments whenever profile changes
  notifyProfileUpdated: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  lastProfileUpdate: 0,
  notifyProfileUpdated: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // timestamp increments when profile is updated
  const [lastProfileUpdate, setLastProfileUpdate] = useState<number>(0);

  // ⏳ Refresh user with existing JWT
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

  // 🔄 On app start, restore token & refresh user
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

  // 🔐 Login: save token + refresh user
  const login = async (token: string) => {
    await saveToken(token);
    // refresh user after saving token
    await refreshUser();
  };

  // 🚪 Logout: notify server, clear local token
  const logout = async () => {
    try {
      await authFetch(`${BASE_URL}/auth/logout`, { method: "POST" });
    } catch {
      // ignore server logout errors
    }
    await clearToken();
    setUser(null);
  };

  // Notify other components that profile changed (call after profile PUT or avatar upload/delete)
  const notifyProfileUpdated = () => {
    setLastProfileUpdate(Date.now());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        lastProfileUpdate,
        notifyProfileUpdated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
