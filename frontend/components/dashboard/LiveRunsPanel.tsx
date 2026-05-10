"use client";

import clsx from "clsx";
import { Radio, RefreshCw } from "lucide-react";
import type { AgentStep, RunStatus, RunStatusValue } from "@/lib/types";
import { useSiteConfig } from "@/app/providers";
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
  const cfg = useSiteConfig();
  return (
    <div className="panel space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Live run</h2>
        <p className="mt-1 text-sm text-slate-500">
          Polls <code className="font-mono text-slate-400">/status</code> (and opens WS when configured). Use{" "}
          <strong className="text-slate-400">Start here → Run full demo</strong> to auto-fill a <code className="font-mono text-slate-400">run_id</code>
          , or paste one from History.
        </p>
        {!watchRunId.trim() && (
          <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
            No run selected — switch to <strong className="text-amber-50">Start here</strong> and launch the demo, or paste a run id above.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          value={watchRunId}
          onChange={(e) => setWatchRunId(e.target.value)}
          className="input-field min-w-0 flex-1 font-mono text-xs sm:text-sm"
          placeholder="e.g. 8f3c2b1a-…"
          aria-label="Run ID to watch"
        />
        <button
          type="button"
          onClick={() => void onConnect()}
          className={clsx(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition",
            cfg.accent.primary,
            cfg.accent.primaryHover,
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {liveRun && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
              statusColor[liveRun.status as RunStatusValue] ?? statusColor.error,
            )}
          >
            <Radio className="h-3 w-3" />
            {liveRun.status}
          </span>
          <span className="text-xs text-slate-500">
            Intent <span className="font-medium text-slate-300">{liveRun.intent}</span> · confidence{" "}
            {liveRun.intent_confidence.toFixed(2)}
          </span>
        </div>
      )}

      <div className="relative space-y-0">
        {liveSteps.length === 0 ? (
          <div className="panel-inset py-12 text-center text-sm text-slate-500">No steps loaded yet — enter a run id and refresh.</div>
        ) : (
          liveSteps.map((step, idx) => (
            <div key={`${step.timestamp}-${idx}`} className="relative flex gap-4 pb-8 last:pb-0">
              {idx < liveSteps.length - 1 && (
                <span
                  className="absolute left-[11px] top-8 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-white/20 to-transparent"
                  aria-hidden
                />
              )}
              <div className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white/30 bg-slate-900 shadow-[0_0_12px_rgba(56,189,248,0.35)]" />
              <div className="panel-inset min-w-0 flex-1 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{step.timestamp}</p>
                <p className={clsx("mt-1 text-sm font-semibold", agentColor[step.agent] ?? "text-slate-200")}>{step.agent}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">{step.action}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{step.output}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {liveRun?.final_response && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-5 shadow-inner">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/90">Final response</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-emerald-50/95">{liveRun.final_response}</p>
        </div>
      )}
    </div>
  );
}
