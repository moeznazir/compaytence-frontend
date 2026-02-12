import { useAuthStore } from "@/store/auth-store";

const MOCK_DELAY = 400;

function delay(ms: number = MOCK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || res.statusText);
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
