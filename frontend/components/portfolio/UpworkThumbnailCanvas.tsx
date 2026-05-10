"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";
import type { RunStatus } from "@/lib/types";

const TAGS = ["FastAPI", "PostgreSQL", "LangGraph", "Redis", "WebSockets", "Next.js", "Docker"] as const;

function metricCards(run: RunStatus | null, stepCount: number): { value: string; label: string }[] {
  if (run) {
    const conf = Math.round((run.intent_confidence ?? 0) * 100);
    const state = run.status === "completed" ? "OK" : run.status.replace(/_/g, " ").toUpperCase().slice(0, 8);
    return [
      { value: `${conf}%`, label: "INTENT SCORE" },
      { value: `${stepCount}`, label: "AGENT HOPS" },
      { value: "REST", label: "/WEBHOOK · /STATUS" },
      { value: state, label: "RUN STATE" },
    ];
  }
  return [
    { value: "<100ms", label: "STATUS POLL" },
    { value: "3", label: "GRAPH NODES" },
    { value: "KEY", label: "IDEMPOTENCY" },
    { value: "REST", label: "/WEBHOOK · /RUNS" },
  ];
}

export default function UpworkThumbnailCanvas({ runId }: { runId: string | null }) {
  const [run, setRun] = useState<RunStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!runId?.trim()) {
        if (!cancelled) {
          setRun(null);
          setReady(true);
        }
        return;
      }
      try {
        const data = await fetchJson<RunStatus>(`/api/v1/status/${encodeURIComponent(runId.trim())}`);
        if (cancelled) return;
        setRun(data);
      } catch {
        if (!cancelled) setRun(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const stepCount = run?.agent_steps?.length ?? 0;
  const cards = metricCards(run, stepCount);

  return (
    <div
      data-testid="portfolio-upwork-thumb-ready"
      data-ready={ready ? "1" : "0"}
      className="relative box-border h-[750px] w-[1000px] overflow-hidden text-slate-100"
      style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Base + radial (lighter top-right, Sentinel-style) */}
      <div
        className="absolute inset-0 bg-[#0a1628]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 95% 70% at 92% 8%, rgba(30, 58, 95, 0.55) 0%, transparent 52%),
            radial-gradient(ellipse 60% 50% at 10% 90%, rgba(6, 20, 40, 0.9) 0%, transparent 55%),
            linear-gradient(165deg, #0a1628 0%, #060d18 100%)
          `,
        }}
        aria-hidden
      />

      {/* Cyan engineering grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 242, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 255, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />

      {/* Top edge cyan hairline */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent"
        aria-hidden
      />

      {/* Content: weighted top-left */}
      <div className="relative flex h-full flex-col pl-12 pr-10 pt-14 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-400">Reference stack</p>

        <h1 className="mt-4 max-w-[720px] text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em]">
          <span className="text-white">AutoFlow</span>
          <span className="text-cyan-400"> — Inquiry automation plane</span>
        </h1>

        <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-slate-400">
          FastAPI · LangGraph + Ollama · Redis live state · Postgres audit · WebSocket / poll status · Next.js console
        </p>

        {/* 2×2 metrics */}
        <div className="mt-10 grid w-[460px] grid-cols-2 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-cyan-500/15 bg-[#0c1e35]/80 px-5 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-[2px]"
            >
              <p className="text-[2rem] font-bold tabular-nums leading-none tracking-tight text-white">{c.value}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Mono tech pills */}
        <div className="mt-10 flex max-w-[720px] flex-wrap gap-2.5">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-md border border-cyan-400/45 bg-[#050a14]/90 px-3.5 py-2 font-mono text-[13px] font-medium text-white shadow-[0_0_20px_-8px_rgba(34,211,238,0.35)]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Subtle run id — proof without clutter */}
        {runId?.trim() && (
          <p className="mt-auto pt-8 font-mono text-[10px] tracking-wide text-slate-600">
            trace · {runId.trim().slice(0, 8)}…{runId.trim().slice(-4)}
          </p>
        )}
      </div>
    </div>
  );
}
