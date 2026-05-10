import clsx from "clsx";
import type { AgentStep, RunStatus, RunStatusValue } from "@/lib/types";
import { agentColor, statusColor } from "@/components/dashboard/constants";

export function LiveRunsPanel({
  watchRunId,
  setWatchRunId,
  liveRun,
  liveSteps,
  onConnect,
}: {
  watchRunId: string;
  setWatchRunId: (v: string) => void;
  liveRun: RunStatus | null;
  liveSteps: AgentStep[];
  onConnect: () => void | Promise<void>;
}) {
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex gap-2">
        <input
          value={watchRunId}
          onChange={(e) => setWatchRunId(e.target.value)}
          className="w-full rounded-lg border border-border bg-slate-950/70 px-3 py-2 text-sm"
          placeholder="Paste run_id to stream"
          aria-label="Run ID to watch"
        />
        <button
          type="button"
          onClick={() => void onConnect()}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
        >
          Connect
        </button>
      </div>

      {liveRun && (
        <div
          className={clsx(
            "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
            statusColor[liveRun.status as RunStatusValue] ?? statusColor.error,
          )}
        >
          {liveRun.status.toUpperCase()}
        </div>
      )}

      <div className="space-y-3">
        {liveSteps.map((step, idx) => (
          <div key={`${step.timestamp}-${idx}`} className="rounded-lg border border-border bg-slate-950/50 p-3">
            <p className={clsx("text-sm font-semibold", agentColor[step.agent] ?? "text-slate-300")}>{step.agent}</p>
            <p className="mt-1 text-sm text-slate-300">{step.action}</p>
            <p className="mt-2 text-sm text-slate-200">{step.output}</p>
          </div>
        ))}
      </div>

      {liveRun?.final_response && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-900/20 p-4">
          <h3 className="text-sm font-semibold text-emerald-200">Final Response</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{liveRun.final_response}</p>
        </div>
      )}
    </div>
  );
}
