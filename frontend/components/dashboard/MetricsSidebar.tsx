import { Activity, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RunListItem } from "@/lib/types";
import { Metric } from "@/components/dashboard/FormControls";
import { getApiBase } from "@/lib/http";

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

  return (
    <aside className="panel col-span-12 space-y-6 p-5 xl:col-span-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">AutoFlow</p>
        <h1 className="mt-1 text-2xl font-semibold">Control Center</h1>
      </div>

      {isHydrating && (
        <p className="rounded-lg border border-slate-600/50 bg-slate-900/60 p-3 text-sm text-slate-300">Checking API…</p>
      )}

      {showStaleBanner && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-sm text-amber-200">
          Last refresh: {loadError}
        </p>
      )}

      {showOffline && (
        <div className="rounded-lg border border-slate-600/60 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="font-medium text-slate-100">Backend not connected</p>
          <p className="mt-2 leading-relaxed text-slate-400">
            This UI expects the AutoFlow API at <span className="font-mono text-sky-300">{apiBase}</span>. Start it with{" "}
            <code className="rounded bg-slate-950 px-1 py-0.5 font-mono text-xs">uvicorn app.main:app --reload</code> and
            ensure Redis + Postgres are up (see README).
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-300">System Health</h2>
        {health === null ? (
          <div className="rounded-lg border border-border bg-slate-950/70 p-4 text-xs text-slate-400">
            {isHydrating ? "Loading health payload…" : "No health data yet — start the API to see Ollama, Redis, and database status."}
          </div>
        ) : (
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950/70 p-3 text-xs text-slate-200">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric title="Total Runs" value={stats.total} icon={<Activity size={16} />} />
        <Metric title="Running" value={stats.running} icon={<Clock3 size={16} />} />
        <Metric title="Completed" value={stats.completed} icon={<CheckCircle2 size={16} />} />
        <Metric title="Escalated" value={stats.escalated} icon={<AlertTriangle size={16} />} />
      </div>

      <div className="h-48 rounded-lg border border-border bg-slate-950/50 p-2">
        <p className="mb-1 px-1 text-xs text-slate-500">Run mix (from /runs)</p>
        <ResponsiveContainer width="100%" height="calc(100% - 1.25rem)">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </aside>
  );
}
