/**
 * Convert an array of objects to a CSV string and trigger download.
 * Uses object keys as headers; pass columns to control order and which keys to include.
 */
export function exportTableToCsv(
  rows: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; header: string }[]
): void {
  if (rows.length === 0) {
    const headers = columns?.map((c) => c.header) ?? Object.keys(rows[0] as object);
    const csv = headers.join(",") + "\n";
    downloadCsv(csv, filename);
    return;
  }

  const keys = columns?.map((c) => c.key) ?? Object.keys(rows[0] as object);
  const headers = columns?.map((c) => c.header) ?? keys;
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) => keys.map((k) => escape((row as Record<string, unknown>)[k])).join(","));
  const csv = [headerRow, ...dataRows].join("\n");
  downloadCsv(csv, filename);
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
