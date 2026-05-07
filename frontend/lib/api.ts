import { InquiryRequest, RunListItem, RunStatus, WebhookResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function getHealth(): Promise<Record<string, unknown>> {
  return request("/health");
}

export async function createInquiry(payload: InquiryRequest): Promise<WebhookResponse> {
  return request("/api/v1/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRun(runId: string): Promise<RunStatus> {
  return request(`/api/v1/status/${runId}`);
}

export async function getRuns(): Promise<RunListItem[]> {
  return request("/api/v1/runs");
}

export async function getRunDetails(runId: string): Promise<RunStatus> {
  return request(`/api/v1/runs/${runId}`);
}

export function getWebSocketUrl(runId: string): string {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/api/v1/ws/${runId}`;
}
