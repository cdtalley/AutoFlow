import clsx from "clsx";
import type { RunListItem, RunStatus, RunStatusValue } from "@/lib/types";
import { agentColor, statusColor } from "@/components/dashboard/constants";

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
    <div className="panel space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {(["all", "completed", "escalated", "error", "running"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setHistoryFilter(f)}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-sm",
              historyFilter === f ? "border-sky-400 bg-sky-500/20 text-sky-200" : "border-border text-slate-300",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-slate-950/70 text-left text-slate-300">
            <tr>
              <th className="px-3 py-2">Run ID</th>
              <th className="px-3 py-2">Sender</th>
              <th className="px-3 py-2">Intent</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-panel/60">
            {filteredRuns.map((run) => (
              <tr
                key={run.run_id}
                onClick={() => onSelectRun(run.run_id)}
                className="cursor-pointer hover:bg-slate-800/60"
              >
                <td className="px-3 py-2 font-mono text-xs">{run.run_id}</td>
                <td className="px-3 py-2">{run.sender_name}</td>
                <td className="px-3 py-2">{run.intent}</td>
                <td className="px-3 py-2">
                  <span
                    className={clsx(
                      "rounded-full border px-2 py-0.5 text-xs",
                      statusColor[run.status as RunStatusValue] ?? statusColor.error,
                    )}
                  >
                    {run.status}
                  </span>
                </td>
                <td className="px-3 py-2">{new Date(run.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRun && (
        <div className="rounded-xl border border-border bg-slate-950/60 p-4">
          <h3 className="text-lg font-semibold">Run Detail: {selectedRun.run_id}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Intent: {selectedRun.intent} | Confidence: {selectedRun.intent_confidence.toFixed(2)} | Lead tier:{" "}
            {selectedRun.lead_tier ?? "n/a"}
          </p>
          <div className="mt-4 space-y-2">
            {selectedRun.agent_steps.map((step, idx) => (
              <div key={`${step.timestamp}-${idx}`} className="rounded-lg border border-border p-3">
                <p className="text-xs text-slate-400">{step.timestamp}</p>
                <p className={clsx("font-medium", agentColor[step.agent] ?? "text-slate-200")}>{step.agent}</p>
                <p className="text-sm text-slate-200">{step.action}</p>
                <p className="text-sm text-slate-300">{step.output}</p>
              </div>
            ))}
          </div>
          {selectedRun.final_response && (
            <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-900/20 p-3">
              <p className="text-sm text-emerald-200">{selectedRun.final_response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
