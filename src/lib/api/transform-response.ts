/** Normalized table shape: headers + rows (e.g. after transform API). */
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
