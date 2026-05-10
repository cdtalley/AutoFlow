"use client";

import clsx from "clsx";
import { Inbox } from "lucide-react";
import type { RunListItem, RunStatus, RunStatusValue } from "@/lib/types";
import { agentColor, statusColor } from "@/components/dashboard/constants";

const FILTERS: { id: "all" | RunStatusValue; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "completed", label: "Completed" },
  { id: "escalated", label: "Escalated" },
  { id: "error", label: "Error" },
];

export function RunHistoryPanel({
  filteredRuns,
  historyFilter,
  setHistoryFilter,
  selectedRun,
  onSelectRun,
}: {
  filteredRuns: RunListItem[];
  historyFilter: "all" | RunStatusValue;
  setHistoryFilter: (f: "all" | RunStatusValue) => void;
  selectedRun: RunStatus | null;
  onSelectRun: (runId: string) => void;
}) {
  return (
    <div className="panel space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Run history</h2>
        <p className="mt-1 text-sm text-slate-500">Durable records from Postgres. Click a row for agent steps and final output.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setHistoryFilter(f.id)}
            className={clsx(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
              historyFilter === f.id
                ? "border-white/20 bg-white/10 text-white shadow-inner"
                : "border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredRuns.length === 0 ? (
        <div className="panel-inset flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Inbox className="h-10 w-10 text-slate-600" strokeWidth={1.25} />
          <p className="text-sm font-medium text-slate-400">No runs match this filter</p>
          <p className="max-w-sm text-xs text-slate-600">Submit an inquiry or widen the filter to see orchestration history.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-slate-950/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run</th>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Intent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/30">
                {filteredRuns.map((run) => (
                  <tr
                    key={run.run_id}
                    onClick={() => onSelectRun(run.run_id)}
                    className="cursor-pointer transition hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-sky-200/90" title={run.run_id}>
                      {run.run_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-slate-200">{run.sender_name}</td>
                    <td className="px-4 py-3 text-slate-400">{run.intent || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          statusColor[run.status as RunStatusValue] ?? statusColor.error,
                        )}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRun && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
          <div className="flex flex-col gap-1 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-mono text-sm font-semibold text-white">{selectedRun.run_id}</h3>
            <span
              className={clsx(
                "w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                statusColor[selectedRun.status as RunStatusValue] ?? statusColor.error,
              )}
            >
              {selectedRun.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Intent <span className="font-medium text-slate-300">{selectedRun.intent}</span> · confidence{" "}
            {selectedRun.intent_confidence.toFixed(2)} · lead{" "}
            <span className="text-slate-400">{selectedRun.lead_tier ?? "n/a"}</span>
          </p>
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent trace</p>
            {selectedRun.agent_steps.map((step, idx) => (
              <div key={`${step.timestamp}-${idx}`} className="panel-inset p-4">
                <p className="text-[10px] text-slate-500">{step.timestamp}</p>
                <p className={clsx("mt-1 text-sm font-semibold", agentColor[step.agent] ?? "text-slate-200")}>{step.agent}</p>
                <p className="mt-1 text-xs text-slate-500">{step.action}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{step.output}</p>
              </div>
            ))}
          </div>
          {selectedRun.final_response && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">Draft / response</p>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/95">{selectedRun.final_response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
