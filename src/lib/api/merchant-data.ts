import { externalGet } from "./external-client";

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

  const path = `/merchant_data_dev?${search}`;
  const data = await externalGet<MerchantDataResponse>("xanoData", path, {
    token,
    errorFallback: "Merchant data request failed",
  });
  return data ?? ({} as MerchantDataResponse);
}
