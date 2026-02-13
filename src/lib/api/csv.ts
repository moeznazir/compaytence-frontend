import type { CsvUploadStatus } from "@/lib/types";
import { mockGet, mockPost, ensureAuthorized } from "./client";
import { useAuthStore } from "@/store/auth-store";

const TRANSFORM_DATA_URL = "https://xkt8-uti5-g3tj.n7e.xano.io/api:6xe0tZ0a/transform_data";
const UPLOAD_DATA_URL = "https://xkt8-uti5-g3tj.n7e.xano.io/api:6xe0tZ0a/upload_data";

export type CsvTransformType =
  | "paypal_balance_summary"
  | "paypal_statement"
  | "paypal_reconciliation"
  | "paypal_disputes"
  | "shopify_payments"
  | "stripe";

/** Normalized table shape: headers + rows (e.g. after transform). */
export interface TransformTableResult {
  headers: string[];
  rows: Record<string, string>[];
}

/** Normalize API response to { headers, rows } for display. */
export function normalizeTransformResponse(raw: unknown): TransformTableResult {
  if (Array.isArray(raw)) {
    const rows = raw as Record<string, string>[];
    const headers = rows.length > 0 ? Object.keys(rows[0]!) : [];
    return { headers, rows };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const data = (obj.data ?? obj.rows) as Record<string, string>[] | undefined;
    const headerArr = obj.headers as string[] | undefined;
    if (Array.isArray(data)) {
      const headers = headerArr?.length ? headerArr : (data[0] ? Object.keys(data[0]) : []);
      return { headers, rows: data };
    }
  }
  return { headers: [], rows: [] };
}

/** POST table data + doc type to transform API (headers to English). Returns normalized { headers, rows }. */
export async function transformCsvData(
  data: Record<string, string>[],
  type: CsvTransformType
): Promise<TransformTableResult> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(TRANSFORM_DATA_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ data, type }),
  });
  ensureAuthorized(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Transform failed: ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  return normalizeTransformResponse(json);
}

/** POST selected records + doc type to upload_data API. Same body shape as transform: { data, type }. */
export async function uploadData(
  data: Record<string, string>[],
  type: CsvTransformType
): Promise<unknown> {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(UPLOAD_DATA_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ data, type }),
  });
  ensureAuthorized(res);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadCsv(file: File): Promise<CsvUploadStatus> {
  return mockPost({
    id: "upload-" + Date.now(),
    fileName: file.name,
    status: "completed",
    progress: 100,
    createdAt: new Date().toISOString(),
  } as CsvUploadStatus);
}

export async function getUploadStatus(id: string): Promise<CsvUploadStatus> {
  return mockGet({
    id,
    fileName: "upload.csv",
    status: "completed",
    progress: 100,
    createdAt: new Date().toISOString(),
  } as CsvUploadStatus);
}
