// lib/auth.ts
let useSecure = false;
let SecureStore: any = null;

try {
  SecureStore = require("expo-secure-store");
  useSecure = !!SecureStore?.getItemAsync;
} catch {
  useSecure = false;
}

let memory: Record<string, string> = {};
let AsyncStorage: any = null;

try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  /* optional */
}

const TOKEN_KEY = "jwt";

export async function saveToken(token: string) {
  if (useSecure) return SecureStore.setItemAsync(TOKEN_KEY, token);
  if (AsyncStorage) return AsyncStorage.setItem(TOKEN_KEY, token);
  memory[TOKEN_KEY] = token;
}

export async function getToken(): Promise<string | null> {
  if (useSecure) return SecureStore.getItemAsync(TOKEN_KEY);
  if (AsyncStorage) return AsyncStorage.getItem(TOKEN_KEY);
  return memory[TOKEN_KEY] ?? null;
}

export async function clearToken() {
  if (useSecure) return SecureStore.deleteItemAsync(TOKEN_KEY);
  if (AsyncStorage) return AsyncStorage.removeItem(TOKEN_KEY);
  delete memory[TOKEN_KEY];
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const token = await getToken();
  console.log("authFetch - token present:", !!token);
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
