import React, { createContext, useContext, useEffect, useState } from "react";
import { authFetch, clearToken, getToken, saveToken } from "../lib/auth";
import BASE_URL from "../lib/apiconfig";

type Role = "admin" | "user";
type User = { username: string; role: Role } | null;

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

/**
 * The AuthProvider is a component that wraps your entire application
 * to provide a global, consistent authentication state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  // This state prevents redirects before the initial session check is complete.
  const [initialLoading, setInitialLoading] = useState(true);

  /**
   * Refreshes the user session by fetching data from the /me endpoint.
   * It uses authFetch, which automatically includes the JWT.
   */
  const refresh = async () => {
    try {
      const r = await authFetch(`${BASE_URL}/me`);
      if (!r.ok) {
        console.error(
          "3. [AuthProvider] /me request failed with status:",
          r.status
        );
        setUser(null); // If the request fails, ensure the user is logged out.
        return;
      }
      const data = await r.json();
      console.log(
        "3. [AuthProvider] User data received and being set:",
        data.user
      );
      setUser(data?.user ?? null);
    } catch (err) {
      console.error("3. [AuthProvider] An error occurred during refresh:", err);
      setUser(null);
    }
  };

  /**
   * This effect runs ONLY ONCE when the app starts.
   * It checks for a pre-existing token in storage and tries to refresh
   * the session if one is found.
   */
  useEffect(() => {
    const checkExistingSession = async () => {
      const existingToken = await getToken();
      if (existingToken) {
        await refresh();
      }
      // Mark the initial check as complete.
      setInitialLoading(false);
    };
    checkExistingSession();
  }, []);

  /**
   * The login function is called from the Login Screen.
   * It saves the new token and then refreshes the user state.
   */
  const login = async (token: string) => {
    await saveToken(token);
    await refresh();
  };

  /**
   * The logout function clears the user state, removes the token
   * from storage, and makes a request to the server's logout endpoint.
   */
  const logout = async () => {
    try {
      await authFetch(`${BASE_URL}/logout`, { method: "POST" });
    } catch {} // Ignore errors, as we are logging out anyway.
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading: initialLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * A custom hook to easily access the authentication context from any component.
 */
export function useAuth() {
  return useContext(AuthContext);
}
