// lib/auth.ts
let useSecure = false;
let SecureStore: any = null;

try {
  SecureStore = require("expo-secure-store");
  useSecure = !!SecureStore?.getItemAsync;
} catch {
  useSecure = false;
}

let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

const TOKEN_KEY = "jwt";
let memory: Record<string, string> = {};

// save token
export async function saveToken(token: string) {
  if (useSecure) return SecureStore.setItemAsync(TOKEN_KEY, token);
  if (AsyncStorage) return AsyncStorage.setItem(TOKEN_KEY, token);
  memory[TOKEN_KEY] = token;
}

// get token
export async function getToken(): Promise<string | null> {
  try {
    if (useSecure) return SecureStore.getItemAsync(TOKEN_KEY);
    if (AsyncStorage) return AsyncStorage.getItem(TOKEN_KEY);
    return memory[TOKEN_KEY] ?? null;
  } catch {
    return null;
  }
}

// clear token
export async function clearToken() {
  if (useSecure) return SecureStore.deleteItemAsync(TOKEN_KEY);
  if (AsyncStorage) return AsyncStorage.removeItem(TOKEN_KEY);
  delete memory[TOKEN_KEY];
}

// wrapper that attaches Authorization header if token exists
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const token = await getToken().catch(() => null);
  console.log("[authFetch] URL:", input);
  console.log("[authFetch] Token:", token);

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  console.log("[authFetch] Response status:", response.status);
  return response;
}
