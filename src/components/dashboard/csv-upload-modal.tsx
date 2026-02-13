"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FileText, X, CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { transformCsvData } from "@/lib/api/csv";
import { toast } from "sonner";

export const CSV_FILE_TYPES = [
  { value: "paypal_balance_summary", label: "PayPal (Balance Summary)" },
  { value: "paypal_statement", label: "PayPal (Statement)" },
  { value: "paypal_reconciliation", label: "PayPal (Reconciliation)" },
  { value: "paypal_disputes", label: "PayPal (Disputes)" },
  { value: "shopify_payments", label: "Shopify Payments" },
  { value: "stripe", label: "Stripe" },
] as const;

export type CsvFileTypeValue = (typeof CSV_FILE_TYPES)[number]["value"];

const ACCEPT = ".csv";
const MAX_SIZE_MB = 10;

/** Parse a single CSV line respecting double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  const s = line.replace(/\r$/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/** Parse full CSV text into array of lines, each line = array of cell values. */
function parseCsvToRawLines(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((line) => parseCsvLine(line));
}

/** Build headers + rows from raw lines, with header row 1-based (e.g. 1 = first line). */
function buildTableFromRawLines(
  rawLines: string[][],
  headerRowOneBased: number
): { headers: string[]; rows: Record<string, string>[] } {
  if (rawLines.length === 0) return { headers: [], rows: [] };
  const headerIndex = Math.max(0, Math.min(headerRowOneBased - 1, rawLines.length - 1));
  const headers = rawLines[headerIndex] ?? [];
  const rows = rawLines.slice(headerIndex + 1).map((values) =>
    Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  );
  return { headers, rows };
}

interface CsvUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_HEADER_ROW_OPTIONS = 20;

export function CsvUploadModal({ open, onClose, onSuccess }: CsvUploadModalProps) {
  const [selectedType, setSelectedType] = useState<CsvFileTypeValue | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [rawCsvLines, setRawCsvLines] = useState<string[][] | null>(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(1); // 1-based: row 1, 2, 3...
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedData = rawCsvLines
    ? buildTableFromRawLines(rawCsvLines, headerRowIndex)
    : null;

  const reset = useCallback(() => {
    setSelectedType("");
    setFile(null);
    setRawCsvLines(null);
    setHeaderRowIndex(1);
    setUploading(false);
    setUploaded(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = () => {
    if (!uploading) {
      reset();
      onClose();
    }
  };

  const validateFile = (f: File): string | null => {
    if (!f.name.toLowerCase().endsWith(".csv")) return "Only CSV files are allowed.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    const err = validateFile(chosen);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(chosen);
    try {
      const text = await chosen.text();
      setRawCsvLines(parseCsvToRawLines(text));
      setHeaderRowIndex(1);
    } catch {
      toast.error("Could not read file.");
      setFile(null);
      setRawCsvLines(null);
      setHeaderRowIndex(1);
    }
  };

  const removeFile = () => {
    setFile(null);
    setRawCsvLines(null);
    setHeaderRowIndex(1);
    if (inputRef.current) inputRef.current.value = "";
  };

  const headerRowOptions = rawCsvLines
    ? Math.min(rawCsvLines.length, MAX_HEADER_ROW_OPTIONS)
    : 0;

  const selectedTypeLabel = CSV_FILE_TYPES.find((t) => t.value === selectedType)?.label ?? "";
  const canUpload = selectedType && file && !uploading && !uploaded;

  const handleUpload = async () => {
    if (!file || !selectedType || !parsedData) return;
    setUploading(true);
    try {
      await transformCsvData(parsedData.rows, selectedType);
      toast.success(`CSV uploaded as ${selectedTypeLabel}`);
      setUploading(false);
      setUploaded(true);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      setUploading(false);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayData = uploaded ? parsedData : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={uploaded ? "Upload complete" : "Upload CSV"}
      size="xl"
      showClose={!uploading}
      footer={
        uploaded ? (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!canUpload}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading…
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-8">
        {!uploaded ? (
          <>
            {/* Step 1: File type */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-sm font-semibold text-theme-accent">
                  1
                </span>
                <h3 className="text-sm font-semibold text-theme-text">
                  What type of file are you uploading?
                </h3>
              </div>
              <ul className="grid gap-2 pl-9 sm:grid-cols-2">
                {CSV_FILE_TYPES.map((opt) => (
                  <li key={opt.value}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-theme-border bg-theme-surface-elevated/50 px-3 py-2.5 transition-colors hover:border-theme-accent/40 hover:bg-theme-surface-elevated has-[:checked]:border-theme-accent has-[:checked]:bg-theme-accent/10">
                      <input
                        type="radio"
                        name="csv-type"
                        value={opt.value}
                        checked={selectedType === opt.value}
                        onChange={() => setSelectedType(opt.value)}
                        disabled={uploading}
                        className="h-4 w-4 border-theme-border text-theme-accent focus:ring-theme-accent"
                      />
                      <span className="text-sm text-theme-text">{opt.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            {/* Step 2: File */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-sm font-semibold text-theme-accent">
                  2
                </span>
                <h3 className="text-sm font-semibold text-theme-text">Choose your file</h3>
              </div>
              <div className="pl-9">
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={onFileChange}
                  className="hidden"
                  id="dashboard-csv-input"
                />
                {file ? (
                  <div className="rounded-xl border border-theme-border bg-theme-surface-elevated/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-theme-accent/15">
                        <FileText className="h-6 w-6 text-theme-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-theme-text" title={file.name}>
                          {file.name}
                        </p>
                        <p className="mt-0.5 text-sm text-theme-text-muted">
                          {(file.size / 1024).toFixed(1)} KB · {selectedTypeLabel}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        disabled={uploading}
                        className="shrink-0 text-theme-text-muted hover:text-theme-text"
                        aria-label="Remove file"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-theme-text-muted">
                      Wrong file? Remove it and{" "}
                      <label
                        htmlFor="dashboard-csv-input"
                        className="cursor-pointer font-medium text-theme-accent hover:underline"
                      >
                        choose another
                      </label>
                      .
                    </p>
                  </div>
                ) : (
                  <label
                    htmlFor="dashboard-csv-input"
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-theme-border bg-theme-surface-elevated/30 py-10 px-6 cursor-pointer transition-colors hover:border-theme-accent/50 hover:bg-theme-surface-elevated/50"
                  >
                    <Upload className="h-10 w-10 text-theme-text-muted" />
                    <span className="text-sm font-medium text-theme-text">
                      Click to choose a CSV file
                    </span>
                    <span className="text-xs text-theme-text-muted">
                      Max {MAX_SIZE_MB} MB
                    </span>
                  </label>
                )}
              </div>
            </section>

            {/* Step 3: Choose header row + preview data before upload */}
            {selectedType && file && rawCsvLines && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-sm font-semibold text-theme-accent">
                    3
                  </span>
                  <h3 className="text-sm font-semibold text-theme-text">
                    Review your data
                  </h3>
                </div>
                <div className="pl-9 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="header-row-select" className="text-sm font-medium text-theme-text">
                      Header starts at row:
                    </label>
                    <select
                      id="header-row-select"
                      value={headerRowIndex}
                      onChange={(e) => setHeaderRowIndex(Number(e.target.value))}
                      className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                      aria-label="Header row"
                    >
                      {Array.from({ length: headerRowOptions }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          Row {n}
                          {n === 1 ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-theme-text-muted">
                      Some files have title lines; pick the row that contains column names.
                    </span>
                  </div>
                  <p className="text-sm text-theme-text-muted">
                    Preview below. Upload when it looks correct.
                  </p>
                </div>
                <div className="pl-9">
                  {parsedData && parsedData.rows.length > 0 ? (
                    <div className="rounded-xl border border-theme-border overflow-hidden">
                      <div className="max-h-[40vh] overflow-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 z-10 border-b border-theme-border bg-theme-surface-elevated">
                            <tr>
                              {parsedData.headers.map((h, i) => (
                                <th
                                  key={`header-${i}`}
                                  className="whitespace-nowrap px-4 py-3 font-medium text-theme-text"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {parsedData.rows.slice(0, 100).map((row, i) => (
                              <tr
                                key={i}
                                className="bg-theme-surface hover:bg-theme-surface-elevated/50"
                              >
                                {parsedData.headers.map((key, colIndex) => (
                                  <td
                                    key={`cell-${colIndex}`}
                                    className="whitespace-nowrap px-4 py-2.5 text-theme-text"
                                  >
                                    {row[key] ?? "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedData.rows.length > 100 && (
                        <div className="border-t border-theme-border bg-theme-surface-elevated px-4 py-2 text-xs text-theme-text-muted">
                          Showing first 100 of {parsedData.rows.length} rows
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-theme-border bg-theme-surface-elevated/50 px-4 py-3 text-sm text-theme-text-muted">
                      No data rows in this file (header only or empty).
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Post-upload: success + table */
          <section className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-accent/10 px-4 py-3 text-theme-text">
              <CheckCircle className="h-5 w-5 shrink-0 text-theme-accent" />
              <span className="text-sm font-medium">
                Your file was uploaded as {selectedTypeLabel}. Here’s a preview of the data.
              </span>
            </div>
            {displayData && displayData.rows.length > 0 ? (
              <div className="rounded-xl border border-theme-border overflow-hidden">
                <div className="max-h-[50vh] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-theme-border bg-theme-surface-elevated">
                      <tr>
                        {displayData.headers.map((h, i) => (
                          <th
                            key={`header-${i}`}
                            className="whitespace-nowrap px-4 py-3 font-medium text-theme-text"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {displayData.rows.slice(0, 100).map((row, i) => (
                        <tr
                          key={i}
                          className="bg-theme-surface hover:bg-theme-surface-elevated/50"
                        >
                          {displayData.headers.map((key, colIndex) => (
                            <td
                              key={`cell-${colIndex}`}
                              className="whitespace-nowrap px-4 py-2.5 text-theme-text"
                            >
                              {row[key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {displayData.rows.length > 100 && (
                  <div className="border-t border-theme-border bg-theme-surface-elevated px-4 py-2 text-xs text-theme-text-muted">
                    Showing first 100 of {displayData.rows.length} rows
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-theme-text-muted">
                No table data to display (file may be empty or header-only).
              </p>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
