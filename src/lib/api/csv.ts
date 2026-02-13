import type { CsvUploadStatus } from "@/lib/types";
import { mockGet, mockPost, ensureAuthorized } from "./client";
import { useAuthStore } from "@/store/auth-store";

const TRANSFORM_DATA_URL = "https://xkt8-uti5-g3tj.n7e.xano.io/api:6xe0tZ0a/transform_data";

export type CsvTransformType =
  | "paypal_balance_summary"
  | "paypal_statement"
  | "paypal_reconciliation"
  | "paypal_disputes"
  | "shopify_payments"
  | "stripe";

/** POST uploaded CSV data and type to the transform API. */
export async function transformCsvData(
  data: Record<string, string>[],
  type: CsvTransformType
): Promise<unknown> {
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
