/**
 * Safe fetch with timeout and AbortSignal support.
 * Throws typed errors for network, timeout, and HTTP errors.
 */

export class FetchError extends Error {
  readonly status?: number;
  readonly code?: "timeout" | "network" | "http" | "parse";
  constructor(
    message: string,
    status?: number,
    code?: "timeout" | "network" | "http" | "parse"
  ) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export interface SafeFetchOptions extends Omit<RequestInit, "signal"> {
  /** Timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** AbortSignal from caller to cancel request. */
  signal?: AbortSignal | null;
}

/**
 * Fetch with timeout and optional abort signal.
 * - On timeout or abort: throws FetchError with code "timeout" or message containing "abort".
 * - On !response.ok: throws FetchError with status and code "http".
 * - On JSON parse error: throws FetchError with code "parse".
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: outerSignal, ...init } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (outerSignal?.aborted) {
    clearTimeout(timeoutId);
    throw new FetchError("Request was cancelled.", undefined, "timeout");
  }
  if (outerSignal) {
    outerSignal.addEventListener("abort", () => controller.abort());
  }
  const signal = controller.signal;

  try {
    const response = await fetch(url, { ...init, signal });

    if (response.status === 429) {
      throw new FetchError(
        "Too many requests. Please try again in a minute.",
        429,
        "http"
      );
    }

    if (!response.ok) {
      throw new FetchError(
        `Network error: ${response.status} ${response.statusText}. Try again later.`,
        response.status,
        "http"
      );
    }

    return response;
  } catch (e) {
    if (e instanceof FetchError) throw e;
    if (e instanceof Error) {
      if (e.name === "AbortError") {
        clearTimeout(timeoutId);
        throw new FetchError(
          "Request was cancelled or timed out.",
          undefined,
          "timeout"
        );
      }
      throw new FetchError(
        e.message || "Network error. Try again later.",
        undefined,
        "network"
      );
    }
    throw new FetchError("Something went wrong.", undefined, "network");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch and parse JSON. Throws FetchError on parse failure.
 */
export async function safeFetchJson<T>(url: string, options: SafeFetchOptions = {}): Promise<T> {
  const response = await safeFetch(url, options);
  try {
    const data = await response.json();
    return data as T;
  } catch {
    throw new FetchError(
      "Invalid response from server. Please try again.",
      response.status,
      "parse"
    );
  }
}
