"use client";

import clsx from "clsx";
import { Inbox, Loader2, Play } from "lucide-react";
import type { RunListItem, RunStatus, RunStatusValue } from "@/lib/types";
import { useSiteConfig } from "@/app/providers";
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
  onRunDemo,
  demoBusy,
  totalRunCount,
}: {
  filteredRuns: RunListItem[];
  historyFilter: "all" | RunStatusValue;
  setHistoryFilter: (f: "all" | RunStatusValue) => void;
  selectedRun: RunStatus | null;
  onSelectRun: (runId: string) => void;
  onRunDemo?: () => void | Promise<void>;
  demoBusy?: boolean;
  /** Total runs (unfiltered) — for smarter empty states */
  totalRunCount: number;
}) {
  const cfg = useSiteConfig();
  return (
    <div className="panel space-y-6 p-6 sm:p-8" data-testid="run-history-panel">
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
        <div className="panel-inset flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Inbox className="h-10 w-10 text-slate-600" strokeWidth={1.25} />
          <p className="text-sm font-medium text-slate-400">
            {totalRunCount > 0 && historyFilter !== "all"
              ? "No runs for this filter"
              : totalRunCount === 0
                ? "No runs yet"
                : "No runs match this filter"}
          </p>
          <p className="max-w-md text-xs leading-relaxed text-slate-600">
            {totalRunCount > 0 && historyFilter !== "all" ? (
              <>Switch to <strong className="text-slate-500">All</strong> to see {totalRunCount} run(s) in the database.</>
            ) : (
              <>
                History reads from Postgres. Use <strong className="text-slate-500">Start here → Run full demo</strong> for a realistic enterprise
                inquiry, then return to this tab.
              </>
            )}
          </p>
          {onRunDemo && totalRunCount === 0 && (
            <button
              type="button"
              disabled={demoBusy}
              onClick={() => void onRunDemo()}
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition",
                cfg.accent.primary,
                demoBusy && "cursor-wait opacity-70",
              )}
            >
              {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Run demo inquiry
            </button>
          )}
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
                    data-testid="history-table-row"
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
