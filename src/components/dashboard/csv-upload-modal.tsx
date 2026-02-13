"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Loader2, FileText, X, CheckCircle, PlusCircle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { transformCsvData, uploadData, type TransformTableResult } from "@/lib/api/csv";
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
  const [transforming, setTransforming] = useState(false);
  const [transformedData, setTransformedData] = useState<TransformTableResult | null>(null);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [dataTabIndex, setDataTabIndex] = useState(0); // 0 = All data, 1 = Selected records
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedData = rawCsvLines
    ? buildTableFromRawLines(rawCsvLines, headerRowIndex)
    : null;

  const reset = useCallback(() => {
    setSelectedType("");
    setFile(null);
    setRawCsvLines(null);
    setHeaderRowIndex(1);
    setTransforming(false);
    setTransformedData(null);
    setSelectedRowIndices(new Set());
    setDataTabIndex(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // Auto-call transform API when type + file + header row are set and we have rows
  useEffect(() => {
    if (!selectedType || !file || !rawCsvLines) {
      setTransformedData(null);
      return;
    }
    const parsed = buildTableFromRawLines(rawCsvLines, headerRowIndex);
    if (!parsed.rows.length) {
      setTransformedData(null);
      return;
    }
    let cancelled = false;
    setTransforming(true);
    setTransformedData(null);
    setSelectedRowIndices(new Set());
    transformCsvData(parsed.rows, selectedType)
      .then((result) => {
        if (!cancelled) {
          setTransformedData(result);
          setTransforming(false);
          toast.success("Headers translated to English.");
          onSuccess?.();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTransforming(false);
          toast.error(err instanceof Error ? err.message : "Transform failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedType, file, rawCsvLines, headerRowIndex]);

  const handleClose = () => {
    if (!transforming && !uploading) {
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

  const toggleRowSelection = (index: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllRows = () => {
    if (!transformedData?.rows.length) return;
    setSelectedRowIndices(new Set(transformedData.rows.map((_, i) => i)));
  };

  const clearSelection = () => setSelectedRowIndices(new Set());

  /** Remove one row from selection (by original index). */
  const removeSelectedRecord = (originalIndex: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      next.delete(originalIndex);
      return next;
    });
  };

  const selectedRowsWithIndex = transformedData
    ? transformedData.rows
        .map((row, i) => ({ row, originalIndex: i }))
        .filter(({ originalIndex }) => selectedRowIndices.has(originalIndex))
    : [];

  const handleUploadSelected = async () => {
    if (!selectedType || !transformedData || selectedRowIndices.size === 0) return;
    const rowsToUpload = selectedRowsWithIndex.map(({ row }) => row);
    setUploading(true);
    try {
      await uploadData(rowsToUpload, selectedType);
      toast.success(`Uploaded ${rowsToUpload.length} record(s) successfully.`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload CSV"
      size="xl"
      showClose={!transforming && !uploading}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={transforming || uploading}>
            Cancel
          </Button>
          <Button onClick={handleClose}>Done</Button>
        </div>
      }
    >
      <div className="space-y-8">
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
                        disabled={transforming}
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
                        disabled={transforming}
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

            {/* Step 3: Header row → auto-transform → table with row selection + Selected records */}
            {selectedType && file && rawCsvLines && (
              <section className="space-y-4">
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
                      disabled={transforming}
                    >
                      {Array.from({ length: headerRowOptions }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          Row {n}
                          {n === 1 ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-theme-text-muted">
                      Headers are translated to English automatically.
                    </span>
                  </div>
                </div>
                <div className="pl-9">
                  {transforming ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface-elevated/50 py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-theme-accent" />
                      <span className="text-sm text-theme-text-muted">Translating headers…</span>
                    </div>
                  ) : parsedData && parsedData.rows.length === 0 ? (
                    <p className="rounded-lg border border-theme-border bg-theme-surface-elevated/50 px-4 py-3 text-sm text-theme-text-muted">
                      No data rows in this file (header only or empty).
                    </p>
                  ) : transformedData && transformedData.rows.length > 0 ? (
                    <Tabs
                      tabs={[
                        { id: "all", label: "All data", count: transformedData.rows.length },
                        { id: "selected", label: "Selected records", count: selectedRowIndices.size },
                      ]}
                      selectedIndex={dataTabIndex}
                      onChange={setDataTabIndex}
                    >
                      <TabPanel>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={selectAllRows}>
                              Select all
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                              Clear selection
                            </Button>
                            {selectedRowIndices.size > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setDataTabIndex(1)}
                                className="gap-1.5"
                              >
                                View selected ({selectedRowIndices.size})
                              </Button>
                            )}
                          </div>
                          <div className="rounded-xl border border-theme-border overflow-hidden">
                            <div className="max-h-[40vh] overflow-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-theme-border bg-theme-surface-elevated">
                                  <tr>
                                    <th className="w-10 px-2 py-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedRowIndices.size === transformedData.rows.length}
                                        ref={(el) => {
                                          if (el) el.indeterminate = selectedRowIndices.size > 0 && selectedRowIndices.size < transformedData.rows.length;
                                        }}
                                        onChange={() =>
                                          selectedRowIndices.size === transformedData.rows.length
                                            ? clearSelection()
                                            : selectAllRows()
                                        }
                                        className="h-4 w-4 rounded border-theme-border text-theme-accent focus:ring-theme-accent"
                                        aria-label="Select all rows"
                                      />
                                    </th>
                                    {transformedData.headers.map((h, i) => (
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
                                  {transformedData.rows.map((row, i) => (
                                    <tr
                                      key={i}
                                      className={`bg-theme-surface hover:bg-theme-surface-elevated/50 ${selectedRowIndices.has(i) ? "bg-theme-accent/5" : ""}`}
                                    >
                                      <td className="w-10 px-2 py-2.5">
                                        <input
                                          type="checkbox"
                                          checked={selectedRowIndices.has(i)}
                                          onChange={() => toggleRowSelection(i)}
                                          className="h-4 w-4 rounded border-theme-border text-theme-accent focus:ring-theme-accent"
                                          aria-label={`Select row ${i + 1}`}
                                        />
                                      </td>
                                      {transformedData.headers.map((key, colIndex) => (
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
                          </div>
                        </div>
                      </TabPanel>
                      <TabPanel>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDataTabIndex(0)}
                              className="gap-1.5"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Add more records
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUploadSelected}
                              disabled={selectedRowIndices.size === 0 || uploading}
                              className="gap-1.5"
                            >
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload ({selectedRowIndices.size})
                            </Button>
                          </div>
                          {selectedRowsWithIndex.length > 0 ? (
                            <div className="rounded-xl border border-theme-border overflow-hidden">
                              <div className="max-h-[40vh] overflow-auto">
                                <table className="w-full text-left text-sm">
                                  <thead className="sticky top-0 z-10 border-b border-theme-border bg-theme-surface-elevated">
                                    <tr>
                                      <th className="w-12 px-2 py-3 text-theme-text-muted">Remove</th>
                                      {transformedData.headers.map((h, i) => (
                                        <th
                                          key={`sel-header-${i}`}
                                          className="whitespace-nowrap px-4 py-3 font-medium text-theme-text"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-theme-border">
                                    {selectedRowsWithIndex.map(({ row, originalIndex }) => (
                                      <tr key={originalIndex} className="bg-theme-surface hover:bg-theme-surface-elevated/50">
                                        <td className="w-12 px-2 py-2.5">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSelectedRecord(originalIndex)}
                                            className="h-8 w-8 p-0 text-theme-text-muted hover:text-theme-text"
                                            aria-label="Remove from selection"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </td>
                                        {transformedData.headers.map((key, colIndex) => (
                                          <td
                                            key={`sel-cell-${colIndex}`}
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
                            </div>
                          ) : (
                            <div className="rounded-xl border border-theme-border bg-theme-surface-elevated/50 py-8 text-center text-sm text-theme-text-muted">
                              No records selected. Switch to &quot;All data&quot; to select rows.
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    </Tabs>
                  ) : parsedData?.rows.length ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface-elevated/50 py-8 text-sm text-theme-text-muted">
                      Waiting for translation…
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </>
      </div>
    </Modal>
  );
}
