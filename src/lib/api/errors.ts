/**
 * Parse a user-facing error message from an API response.
 * Handles common shapes: { message }, { error }, { msg }, { detail }, { errors: [...] }.
 */
export function parseApiError(
  data: unknown,
  fallback = "Something went wrong"
): string {
  if (data == null) return fallback;
  if (typeof data === "string") return data.trim() || fallback;
  if (typeof data !== "object") return fallback;

  const body = data as Record<string, unknown>;

  const message =
    typeof body.message === "string"
      ? body.message
      : typeof body.error === "string"
        ? body.error
        : typeof body.msg === "string"
          ? body.msg
          : typeof body.detail === "string"
            ? body.detail
            : Array.isArray(body.errors) && body.errors.length > 0
              ? typeof body.errors[0] === "string"
                ? body.errors[0]
                : typeof (body.errors[0] as Record<string, unknown>)?.message === "string"
                  ? (body.errors[0] as Record<string, unknown>).message as string
                  : null
              : null;

  return message?.trim() ?? fallback;
}

/**
 * Parse error from a failed fetch response: reads JSON or text and returns a message.
 */
export async function parseFetchError(
  res: Response,
  fallback = "Request failed"
): Promise<string> {
  const text = await res.text();
  try {
    const data = text ? (JSON.parse(text) as unknown) : null;
    return parseApiError(data, res.statusText || fallback);
  } catch {
    return text?.slice(0, 200)?.trim() || res.statusText || fallback;
  }
}
