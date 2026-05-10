/**
 * Canonical demo inquiry for portfolio / reviewer flows.
 * Keep in sync with Overview “Run full demo” and optional seed scripts.
 */
import type { InquiryRequest } from "@/lib/types";

export const PORTFOLIO_DEMO_INQUIRY: InquiryRequest = {
  sender_name: "Morgan Blake",
  sender_email: "morgan.portfolio@example.com",
  subject: "SOC2 path + 500-seat rollout — technical evaluation",
  body: `We're shortlisting automation vendors for regulated inbound mail.

Must-haves:
• Typed HTTP ingress with rate limits and idempotency
• Explicit multi-agent graph (not a single mega-prompt)
• Durable audit trail in Postgres + fast status in Redis
• Local / air-gapped LLM option for PII-heavy phases

If you support escalation with human-readable reasons, describe how your handoff payload looks.`,
  metadata: { source: "portfolio_demo", segment: "enterprise", review: true },
};
