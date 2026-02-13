import { useAuthStore } from "@/store/auth-store";
import { parseFetchError } from "./errors";

const MOCK_DELAY = 400;

function delay(ms: number = MOCK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** On 401, log out the user and throw. Call after fetch, before reading body. */
export function ensureAuthorized(res: Response): void {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Session expired. Please log in again.");
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });
  ensureAuthorized(res);
  if (!res.ok) {
    const message = await parseFetchError(res, "Request failed");
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// Mock API helpers (used when backend not wired)
export async function mockGet<T>(data: T, ms?: number): Promise<T> {
  await delay(ms);
  return data;
}

export async function mockPost<T>(data: T, ms?: number): Promise<T> {
  await delay(ms);
  return data;
}
