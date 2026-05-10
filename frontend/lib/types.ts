export type RunStatusValue = "running" | "completed" | "escalated" | "error";

export interface InquiryRequest {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
}

export interface WebhookResponse {
  run_id: string;
  status: string;
  message: string;
  poll_url: string;
  idempotent_replay?: boolean;
}

export interface AgentStep {
  agent: string;
  action: string;
  output: string;
  timestamp: string;
}

export interface RunStatus {
  run_id: string;
  status: RunStatusValue;
  intent: string;
  intent_confidence: number;
  current_agent: string;
  agent_steps: AgentStep[];
  final_response: string | null;
  lead_score: number | null;
  lead_tier: string | null;
  escalate: boolean;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunListItem {
  run_id: string;
  status: RunStatusValue;
  intent: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  created_at: string;
}
