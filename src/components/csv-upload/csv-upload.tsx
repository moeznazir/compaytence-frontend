"use client";

import { useState, useRef } from "react";
import { uploadCsv } from "@/lib/api/csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RequirePermission } from "@/lib/rbac";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ACCEPT = ".csv";
const MAX_SIZE_MB = 10;

export function CsvUpload() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return "Only CSV files are allowed.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      toast.error(err);
      setStatus("error");
      setMessage(err);
      return;
    }

    setUploading(true);
    setStatus("idle");
    setMessage("");

    try {
      const result = await uploadCsv(file);
      setStatus(result.status === "failed" ? "error" : "success");
      setMessage(
        result.status === "completed"
          ? "Upload completed."
          : result.message ?? "Processing..."
      );
      if (result.status === "completed") toast.success("CSV uploaded successfully");
      if (result.status === "failed") toast.error(result.message ?? "Upload failed");
    } catch {
      setStatus("error");
      setMessage("Upload failed.");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <RequirePermission permission="upload_csv">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-slate-900">CSV upload</h2>
          <p className="text-sm text-slate-500">
            Upload a CSV for bulk ingestion. Role-restricted.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFile}
            className="hidden"
            id="csv-upload-input"
          />
          <label
            htmlFor="csv-upload-input"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {uploading ? "Uploading..." : "Choose CSV file"}
            </span>
          </label>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload in progress...
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </RequirePermission>
  );
}
