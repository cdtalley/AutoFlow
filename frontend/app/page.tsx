"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Send } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createInquiry, getHealth, getRun, getRunDetails, getRuns, getWebSocketUrl } from "@/lib/api";
import { AgentStep, RunListItem, RunStatus, RunStatusValue } from "@/lib/types";

type Tab = "submit" | "live" | "history";

const statusColor: Record<RunStatusValue, string> = {
  running: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  escalated: "bg-red-500/20 text-red-300 border-red-500/30",
  error: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const agentColor: Record<string, string> = {
  orchestrator: "text-sky-300",
  faq_agent: "text-emerald-300",
  lead_agent: "text-violet-300",
  support_agent: "text-orange-300",
  handoff_agent: "text-red-300",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("submit");
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [watchRunId, setWatchRunId] = useState("");
  const [liveRun, setLiveRun] = useState<RunStatus | null>(null);
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | RunStatusValue>("all");
  const [selectedRun, setSelectedRun] = useState<RunStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    subject: "",
    body: "",
    metadata: "{}",
  });

  const loadSidebar = async () => {
    try {
      const [h, r] = await Promise.all([getHealth(), getRuns()]);
      setHealth(h);
      setRuns(r);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    void loadSidebar();
    const id = setInterval(() => {
      void loadSidebar();
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!watchRunId) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketUrl(watchRunId));
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data) as { type: string; state?: RunStatus };
        if (payload.state) {
          setLiveRun(payload.state);
          setLiveSteps(payload.state.agent_steps ?? []);
        }
      };
    } catch {
      // Poll remains fallback.
    }
    return () => ws?.close();
  }, [watchRunId]);

  useEffect(() => {
    if (!watchRunId) return;
    const id = setInterval(async () => {
      try {
        const data = await getRun(watchRunId);
        setLiveRun(data);
        setLiveSteps(data.agent_steps ?? []);
      } catch {
        // Ignore transient polling errors.
      }
    }, 2000);
    return () => clearInterval(id);
  }, [watchRunId]);

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

  const filteredRuns = runs.filter((r) => (historyFilter === "all" ? true : r.status === historyFilter));

  const submitInquiry = async () => {
    setError(null);
    try {
      const metadata = form.metadata.trim() ? JSON.parse(form.metadata) : {};
      const response = await createInquiry({
        sender_name: form.sender_name,
        sender_email: form.sender_email,
        subject: form.subject,
        body: form.body,
        metadata,
      });
      setWatchRunId(response.run_id);
      setActiveTab("live");
      await loadSidebar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const detail = await getRunDetails(runId);
      setSelectedRun(detail);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-12 gap-5 p-6">
      <aside className="panel col-span-12 space-y-6 p-5 xl:col-span-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">AutoFlow</p>
          <h1 className="mt-1 text-2xl font-semibold">Control Center</h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-slate-300">System Health</h2>
          <pre className="rounded-lg bg-slate-950/70 p-3 text-xs text-slate-200">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric title="Total Runs" value={stats.total} icon={<Activity size={16} />} />
          <Metric title="Running" value={stats.running} icon={<Clock3 size={16} />} />
          <Metric title="Completed" value={stats.completed} icon={<CheckCircle2 size={16} />} />
          <Metric title="Escalated" value={stats.escalated} icon={<AlertTriangle size={16} />} />
        </div>

        <div className="h-48 rounded-lg border border-border bg-slate-950/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </aside>

      <section className="col-span-12 space-y-4 xl:col-span-9">
        <nav className="panel flex items-center gap-2 p-2">
          <TabButton active={activeTab === "submit"} onClick={() => setActiveTab("submit")}>
            Submit Inquiry
          </TabButton>
          <TabButton active={activeTab === "live"} onClick={() => setActiveTab("live")}>
            Live Runs
          </TabButton>
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
            Run History
          </TabButton>
        </nav>

        {error && <p className="rounded-lg border border-red-400/30 bg-red-900/20 p-3 text-sm text-red-200">{error}</p>}

        {activeTab === "submit" && (
          <div className="panel space-y-4 p-5">
            <h2 className="text-xl font-semibold">Submit New Inquiry</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={form.sender_name} onChange={(v) => setForm((s) => ({ ...s, sender_name: v }))} />
              <Input label="Email" value={form.sender_email} onChange={(v) => setForm((s) => ({ ...s, sender_email: v }))} />
            </div>
            <Input label="Subject" value={form.subject} onChange={(v) => setForm((s) => ({ ...s, subject: v }))} />
            <TextArea label="Body" value={form.body} onChange={(v) => setForm((s) => ({ ...s, body: v }))} />
            <TextArea
              label="Metadata JSON"
              value={form.metadata}
              onChange={(v) => setForm((s) => ({ ...s, metadata: v }))}
              rows={5}
            />
            <button
              onClick={submitInquiry}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Send size={16} />
              Launch Workflow
            </button>
          </div>
        )}

        {activeTab === "live" && (
          <div className="panel space-y-4 p-5">
            <div className="flex gap-2">
              <input
                value={watchRunId}
                onChange={(e) => setWatchRunId(e.target.value)}
                className="w-full rounded-lg border border-border bg-slate-950/70 px-3 py-2 text-sm"
                placeholder="Paste run_id to stream"
              />
              <button
                onClick={async () => {
                  if (!watchRunId) return;
                  const data = await getRun(watchRunId);
                  setLiveRun(data);
                  setLiveSteps(data.agent_steps ?? []);
                }}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
              >
                Connect
              </button>
            </div>

            {liveRun && (
              <div className={clsx("inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold", statusColor[liveRun.status])}>
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
        )}

        {activeTab === "history" && (
          <div className="panel space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              {(["all", "completed", "escalated", "error", "running"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f as "all" | RunStatusValue)}
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
                    <tr key={run.run_id} onClick={() => void loadRunDetails(run.run_id)} className="cursor-pointer hover:bg-slate-800/60">
                      <td className="px-3 py-2 font-mono text-xs">{run.run_id}</td>
                      <td className="px-3 py-2">{run.sender_name}</td>
                      <td className="px-3 py-2">{run.intent}</td>
                      <td className="px-3 py-2">
                        <span className={clsx("rounded-full border px-2 py-0.5 text-xs", statusColor[run.status])}>{run.status}</span>
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
        )}
      </section>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-slate-950/60 p-3">
      <div className="flex items-center justify-between text-slate-400">
        <p className="text-xs">{title}</p>
        {icon}
      </div>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-lg px-4 py-2 text-sm font-medium transition",
        active ? "bg-sky-500 text-slate-950" : "text-slate-300 hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-slate-950/70 px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 8,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-slate-300">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-slate-950/70 px-3 py-2 text-sm"
      />
    </label>
  );
}
