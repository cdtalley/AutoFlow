"use client";

import clsx from "clsx";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Cpu, Database, Radio } from "lucide-react";
import { useMemo } from "react";
import { useSiteConfig } from "@/app/providers";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RunListItem } from "@/lib/types";
import { Metric } from "@/components/dashboard/FormControls";
import { getApiBase } from "@/lib/http";

function HealthChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium",
        ok ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200",
      )}
    >
      <span className="flex items-center gap-2 text-slate-400">
        {label === "Database" && <Database className="h-3.5 w-3.5 shrink-0" />}
        {label === "Redis" && <Radio className="h-3.5 w-3.5 shrink-0" />}
        {label === "Ollama" && <Cpu className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </span>
      <span className="tabular-nums">{ok ? "OK" : "Down"}</span>
    </div>
  );
}

export function MetricsSidebar({
  health,
  runs,
  loadError,
  isHydrating,
}: {
  health: Record<string, unknown> | null;
  runs: RunListItem[];
  loadError: string | null;
  isHydrating: boolean;
}) {
  const cfg = useSiteConfig();
  const stats = useMemo(() => {
    const total = runs.length;
    const completed = runs.filter((r) => r.status === "completed").length;
    const escalated = runs.filter((r) => r.status === "escalated").length;
    const running = runs.filter((r) => r.status === "running").length;
    return { total, completed, escalated, running };
  }, [runs]);

  const chartData = [
    { name: "Running", value: stats.running },
    { name: "Completed", value: stats.completed },
    { name: "Escalated", value: stats.escalated },
  ];

  const apiBase = getApiBase();
  const showOffline = !isHydrating && loadError !== null && health === null;
  const showStaleBanner = !isHydrating && loadError !== null && health !== null;

  const overall = health && typeof health["status"] === "string" ? (health["status"] as string) : null;
  const dbOk = Boolean(health?.["database"]);
  const redisOk = Boolean(health?.["redis"]);
  const ollamaOk = Boolean(health?.["ollama"]);

  return (
    <aside className="panel col-span-12 flex flex-col gap-6 p-6 xl:col-span-3 xl:min-h-[calc(100vh-8rem)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{cfg.appName}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{cfg.controlCenterLabel}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Live metrics from your API. Tune copy & colors via env — see `.env.example`.</p>
      </div>

      {isHydrating && (
        <div className="panel-inset flex items-center gap-3 p-3 text-sm text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>
          Connecting to API…
        </div>
      )}

      {showStaleBanner && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-100">
          <span className="font-semibold text-amber-200">Partial refresh.</span> {loadError}
        </p>
      )}

      {showOffline && (
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">Backend not connected</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Expecting AutoFlow at <span className="font-mono text-sky-300/90">{apiBase}</span>. Start{" "}
            <code className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
              uvicorn app.main:app --reload
            </code>{" "}
            with Redis + Postgres (see repo README).
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">System health</h3>
          {overall && (
            <span
              className={clsx(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                overall === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/35 bg-amber-500/10 text-amber-200",
              )}
            >
              {overall}
            </span>
          )}
        </div>

        {health === null ? (
          <div className="panel-inset p-4 text-xs leading-relaxed text-slate-500">
            {isHydrating
              ? "Loading `/health`…"
              : "No health payload yet. Start the API to see database, Redis, and Ollama checks."}
          </div>
        ) : (
          <div className="grid gap-2">
            <HealthChip label="Database" ok={dbOk} />
            <HealthChip label="Redis" ok={redisOk} />
            <HealthChip label="Ollama" ok={ollamaOk} />
            <details className="group panel-inset overflow-hidden">
              <summary className="cursor-pointer select-none px-3 py-2 text-[11px] font-medium text-slate-500 hover:text-slate-400">
                Raw JSON
              </summary>
              <pre className="max-h-40 overflow-auto border-t border-white/5 bg-black/20 p-3 text-[10px] leading-relaxed text-slate-400">
                {JSON.stringify(health, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric title="Total runs" value={stats.total} icon={<Activity size={16} />} />
        <Metric title="Running" value={stats.running} icon={<Clock3 size={16} />} />
        <Metric title="Completed" value={stats.completed} icon={<CheckCircle2 size={16} />} />
        <Metric title="Escalated" value={stats.escalated} icon={<AlertTriangle size={16} />} />
      </div>

      <div className="panel-inset flex min-h-[200px] flex-1 flex-col p-3">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Run mix</p>
        <div className="min-h-[160px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill={cfg.accent.chartFill} radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </aside>
  );
}
