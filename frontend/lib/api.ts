import { fetchJson, getApiBase } from "@/lib/http";
import type { InquiryRequest, RunListItem, RunStatus, WebhookResponse } from "@/lib/types";

function webhookHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const key = process.env.NEXT_PUBLIC_WEBHOOK_API_KEY;
  if (key) {
    h["X-API-Key"] = key;
  }
  return h;
}

export async function getHealth(): Promise<Record<string, unknown>> {
  return fetchJson<Record<string, unknown>>("/health");
}

export async function createInquiry(payload: InquiryRequest): Promise<WebhookResponse> {
  return fetchJson<WebhookResponse>("/api/v1/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: webhookHeaders(),
  });
}

export async function getRun(runId: string): Promise<RunStatus> {
  return fetchJson<RunStatus>(`/api/v1/status/${encodeURIComponent(runId)}`);
}

export async function getRuns(): Promise<RunListItem[]> {
  return fetchJson<RunListItem[]>("/api/v1/runs");
}

export async function getRunDetails(runId: string): Promise<RunStatus> {
  return fetchJson<RunStatus>(`/api/v1/runs/${encodeURIComponent(runId)}`);
}

export function getWebSocketUrl(runId: string): string {
  const base = getApiBase().replace(/^http/, "ws");
  const token = process.env.NEXT_PUBLIC_WEBHOOK_API_KEY;
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${base}/api/v1/ws/${encodeURIComponent(runId)}${q}`;
}
