import type { RunStatusValue } from "@/lib/types";

export const statusColor: Record<RunStatusValue, string> = {
  running: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  escalated: "bg-red-500/20 text-red-300 border-red-500/30",
  error: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export const agentColor: Record<string, string> = {
  orchestrator: "text-sky-300",
  faq_agent: "text-emerald-300",
  lead_agent: "text-violet-300",
  support_agent: "text-orange-300",
  handoff_agent: "text-red-300",
};
