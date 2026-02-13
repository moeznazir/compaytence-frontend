import type { CsvUploadStatus } from "@/lib/types";
import { mockGet, mockPost } from "./client";
import { apiPaths } from "./config";
import { externalPost } from "./external-client";
import {
  normalizeTransformResponse,
  type TransformTableResult,
} from "./transform-response";

export type CsvTransformType =
  | "paypal_balance_summary"
  | "paypal_statement"
  | "paypal_reconciliation"
  | "paypal_disputes"
  | "shopify_payments"
  | "stripe";

export type { TransformTableResult };
export { normalizeTransformResponse };

/** POST table data + doc type to transform API (headers to English). Returns normalized { headers, rows }. */
export async function transformCsvData(
  data: Record<string, string>[],
  type: CsvTransformType
): Promise<TransformTableResult> {
  const raw = await externalPost<unknown>("xanoData", apiPaths.transformData, { data, type }, {
    errorFallback: "Transform failed",
  });
  return normalizeTransformResponse(raw);
}

/** POST selected records + doc type to upload_data API. Same body shape as transform: { data, type }. */
export async function uploadData(
  data: Record<string, string>[],
  type: CsvTransformType
): Promise<unknown> {
  return externalPost<unknown>("xanoData", apiPaths.uploadData, { data, type }, {
    errorFallback: "Upload failed",
  });
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
