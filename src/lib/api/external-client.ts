/**
 * Reusable HTTP client for external APIs.
 * Uses centralized config for base URLs, attaches auth when requested, and handles 401 + errors.
 */

import { useAuthStore } from "@/store/auth-store";
import { buildApiUrl, getApiConfig, type ApiId } from "./config";
import { parseFetchError } from "./errors";

/** On 401, log out the user and throw. Call after fetch, before reading body. */
export function ensureAuthorized(res: Response): void {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Session expired. Please log in again.");
  }
}

export interface ExternalRequestOptions extends RequestInit {
  /** If true, attach Bearer token from auth store (or from tokenOverride). Default true for mutation/read. */
  auth?: boolean;
  /** When set, use this token instead of the store (e.g. right after login before store update). */
  token?: string | null;
  /** Custom error message when response is not ok. */
  errorFallback?: string;
  /** If true, do not run ensureAuthorized (e.g. login endpoint where 401 = bad credentials). */
  skipEnsureAuthorized?: boolean;
}

/**
 * Perform a request to an external API.
 * - URL is built from config: baseUrl + path
 * - Default headers (Content-Type etc.) come from config
 * - If auth is true, Authorization: Bearer <token> is added (from options.token or store)
 * - 401 triggers logout and throw
 * - Non-ok response throws with parsed error message
 */
export async function externalFetch<T = unknown>(
  apiId: ApiId,
  path: string,
  init: RequestInit = {},
  options: ExternalRequestOptions = {}
): Promise<T> {
  const { auth = true, token: tokenOverride, errorFallback, skipEnsureAuthorized, ...restInit } = options;
  const url = buildApiUrl(apiId, path);
  const apiConfig = getApiConfig(apiId);

  const headers: Record<string, string> = {
    ...apiConfig.defaultHeaders,
    ...(restInit.headers as Record<string, string>),
  };

  if (auth) {
    const token = tokenOverride !== undefined ? tokenOverride : useAuthStore.getState().token;
    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...init,
    ...restInit,
    headers,
  });

  if (!skipEnsureAuthorized) {
    ensureAuthorized(res);
  }

  if (!res.ok) {
    const message = await parseFetchError(res, errorFallback ?? "Request failed");
    const urlInfo = ` (${res.status} ${res.statusText} → ${url})`;
    throw new Error(message + urlInfo);
  }

  const text = await res.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(errorFallback ?? "Invalid JSON response");
  }
}

/**
 * GET request to an external API.
 */
export function externalGet<T = unknown>(
  apiId: ApiId,
  path: string,
  options: ExternalRequestOptions = {}
): Promise<T> {
  return externalFetch<T>(apiId, path, { method: "GET" }, options);
}

/**
 * POST request to an external API. Body is JSON-serialized.
 */
export function externalPost<T = unknown>(
  apiId: ApiId,
  path: string,
  body: unknown,
  options: ExternalRequestOptions = {}
): Promise<T> {
  return externalFetch<T>(
    apiId,
    path,
    {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
    options
  );
}
