const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  const requestId = res.headers.get("X-Request-ID");
  const contentType = res.headers.get("content-type") ?? "";
  let parsed: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
  } else if (!res.ok) {
    parsed = await res.text().catch(() => null);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status} ${res.statusText}`;
    if (parsed && typeof parsed === "object" && parsed !== null && "message" in parsed) {
      message = String((parsed as { message: unknown }).message);
    } else if (typeof parsed === "string" && parsed.trim()) {
      message = parsed.trim();
    }
    throw new ApiError(message, res.status, parsed, requestId);
  }

  if (parsed === null && contentType.includes("application/json")) {
    return {} as T;
  }

  return parsed as T;
}

export function getApiBase(): string {
  return API_BASE;
}

/** User-facing copy for dashboard / forms (avoids raw "Failed to fetch" in screenshots). */
export function humanizeApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401 || e.status === 403) {
      return "Not authorized — check API keys match the backend (`WEBHOOK_API_KEY` / `NEXT_PUBLIC_WEBHOOK_API_KEY`).";
    }
    if (e.status >= 500) {
      return "Server error — see API logs. If this persists, check Postgres/Redis/Ollama health.";
    }
    return e.message;
  }
  if (e instanceof TypeError && e.message === "Failed to fetch") {
    return `Cannot reach API at ${API_BASE}. Start the backend (e.g. uvicorn) and confirm CORS / firewall.`;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Request failed";
}
