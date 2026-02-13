import { parseApiError } from "./errors";
import { ensureAuthorized } from "./client";

const MERCHANT_DATA_API =
  "https://xkt8-uti5-g3tj.n7e.xano.io/api:6xe0tZ0a/merchant_data_dev";

export interface MerchantDataParams {
  record_currency: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  merchant_id: string;
}

export interface MerchantDataResponse {
  paypal_master?: {
    merchant_paypal?: Record<string, unknown>[];
    kpi?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  paypal_dispute?: Record<string, unknown>;
  paypal_statement?: {
    raw_data?: unknown[];
    transformed_paypal_statemet?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * GET merchant_data – used for dashboard data.
 * Call on dashboard page load with current filters and logged-in user's company id.
 */
export async function getMerchantData(
  params: MerchantDataParams,
  token: string | null
): Promise<MerchantDataResponse> {
  if (!token) {
    throw new Error("Authorization required");
  }

  const search = new URLSearchParams({
    record_currency: params.record_currency,
    start_date: params.start_date,
    end_date: params.end_date,
    merchant_id: params.merchant_id,
  }).toString();

  const res = await fetch(`${MERCHANT_DATA_API}?${search}`, {
    method: "GET",
    headers: {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  ensureAuthorized(res);
  const text = await res.text();
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    const message = parseApiError(data, res.statusText || "Merchant data request failed");
    throw new Error(message);
  }
  const data = text ? (JSON.parse(text) as MerchantDataResponse) : {};
  return data;
}
