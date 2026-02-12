import type { CsvUploadStatus } from "@/lib/types";
import { mockGet, mockPost } from "./client";

export async function uploadCsv(file: File): Promise<CsvUploadStatus> {
  return mockPost({
    id: "upload-" + Date.now(),
    fileName: file.name,
    status: "processing",
    progress: 0,
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
