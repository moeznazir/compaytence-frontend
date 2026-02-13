/**
 * Centralized configuration for all external APIs.
 * Base URLs can be overridden via environment variables for per-environment setup.
 *
 * Environment variables (optional):
 * - NEXT_PUBLIC_XANO_AUTH_BASE_URL  – Xano auth API base (login, auth/me)
 * - NEXT_PUBLIC_XANO_DATA_BASE_URL  – Xano data API base (transform_data, upload_data, merchant_data_dev)
 * - NEXT_PUBLIC_TRANSFORM_DATA_PATH – Override transform path if Xano uses different name (default: /transform_data)
 * - NEXT_PUBLIC_UPLOAD_DATA_PATH    – Override upload path (default: /upload_data)
 */

export type ApiId = "xanoAuth" | "xanoData";

export interface ApiConfigEntry {
  baseUrl: string;
  /** Optional API version prefix (e.g. "v1") applied to paths if set */
  version?: string;
  /** Headers sent with every request to this API */
  defaultHeaders?: Record<string, string>;
}

function orDefault(env: string | undefined, fallback: string): string {
  const v = (env ?? "").trim();
  return v.length > 0 ? v : fallback;
}

const defaultConfig: Record<ApiId, ApiConfigEntry> = {
  xanoAuth: {
    baseUrl: orDefault(
      process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL,
      "https://xkt8-uti5-g3tj.n7e.xano.io/api:FofqTbkb"
    ),
    defaultHeaders: {
      "Content-Type": "application/json",
    },
  },
  xanoData: {
    baseUrl: orDefault(
      process.env.NEXT_PUBLIC_XANO_DATA_BASE_URL,
      "https://xkt8-uti5-g3tj.n7e.xano.io/api:6xe0tZ0a"
    ),
    defaultHeaders: {
      "Content-Type": "application/json",
    },
  },
} as const;

/** Optional path overrides – set in .env if Xano uses different endpoint names */
export const apiPaths = {
  transformData: orDefault(process.env.NEXT_PUBLIC_TRANSFORM_DATA_PATH, "/transform_data"),
  uploadData: orDefault(process.env.NEXT_PUBLIC_UPLOAD_DATA_PATH, "/upload_data"),
} as const;

let config: Record<ApiId, ApiConfigEntry> = { ...defaultConfig };

/**
 * Get the base URL for an external API.
 */
export function getApiBaseUrl(apiId: ApiId): string {
  return config[apiId].baseUrl.replace(/\/$/, "");
}

/**
 * Get full config entry for an API (base URL, version, default headers).
 */
export function getApiConfig(apiId: ApiId): ApiConfigEntry {
  return config[apiId];
}

/**
 * Build full URL for a request: baseUrl + optional version + path.
 * path should start with "/" (e.g. "/auth/login").
 */
export function buildApiUrl(apiId: ApiId, path: string): string {
  const entry = config[apiId];
  const base = entry.baseUrl.replace(/\/$/, "");
  const version = entry.version ? `/${entry.version}` : "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${version}${normalizedPath}`;
}

/**
 * Replace config (e.g. for tests or runtime overrides).
 */
export function setApiConfig(apiId: ApiId, entry: Partial<ApiConfigEntry>): void {
  config[apiId] = { ...config[apiId], ...entry };
}

/**
 * Reset config to defaults (e.g. after tests).
 */
export function resetApiConfig(): void {
  config = { ...defaultConfig };
}
