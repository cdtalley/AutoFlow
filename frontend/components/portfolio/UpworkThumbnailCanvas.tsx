"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";
import type { RunStatus } from "@/lib/types";

/** Same pill treatment as DocuMind reference — cyan border, mono, white. */
const TAGS = ["FastAPI", "LangGraph", "Ollama", "Next.js", "Docker", "Playwright"] as const;

function metricCards(run: RunStatus | null, stepCount: number): { value: string; label: string }[] {
  if (run) {
    const conf = Math.round((run.intent_confidence ?? 0) * 100);
    const hops = stepCount > 0 ? String(stepCount) : "—";
    return [
      { value: `${conf}%`, label: "INTENT SCORE" },
      { value: hops, label: "AGENT HOPS" },
      { value: "Graph", label: "LANGGRAPH RUN" },
      { value: "REST", label: "/WEBHOOK · /STATUS" },
    ];
  }
  return [
    { value: "Multi", label: "AGENT ROUTING" },
    { value: "Typed", label: "INGRESS + SCHEMA" },
    { value: "PG", label: "AUDIT + HISTORY" },
    { value: "REST", label: "/WEBHOOK · /HEALTH" },
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
      <div className="absolute inset-0 bg-[#060f1c]" aria-hidden />

      <div
        className="pointer-events-none absolute -right-32 top-1/2 h-[min(140%,920px)] w-[min(85%,720px)] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 50%, rgba(34, 211, 238, 0.07) 0%, rgba(56, 189, 248, 0.04) 35%, transparent 70%)",
          border: "1px solid rgba(34, 211, 238, 0.06)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 88% 12%, rgba(30, 64, 100, 0.35) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.65]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.038) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.038) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col px-14 pb-12 pt-[3.25rem]">
        <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-cyan-400/95">Reference stack</p>

        <h1 className="mt-5 max-w-[780px] text-[2.85rem] font-bold leading-[1.06] tracking-[-0.035em]">
          <span className="text-white">AutoFlow</span>
          <span className="text-cyan-400" style={{ textShadow: "0 0 42px rgba(34, 211, 238, 0.22)" }}>
            {" "}
            — Multi-agent inquiry console
          </span>
        </h1>

        <p className="mt-5 max-w-[720px] text-[15px] font-normal leading-[1.55] text-slate-400">
          FastAPI · LangGraph · hybrid agent routing · Postgres audit · Redis live state · Next.js console · Docker
        </p>

        <div className="mt-12 grid w-[500px] grid-cols-2 gap-5">
          {cards.map((c) => (
            <div
              key={`${c.value}-${c.label}`}
              className="rounded-2xl border border-cyan-500/20 bg-[#0c2138]/90 px-6 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            >
              <p className="text-[2.05rem] font-bold leading-none tracking-tight text-white">{c.value}</p>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex max-w-[760px] flex-wrap gap-3">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-lg border border-cyan-400/50 bg-[#040a12]/95 px-4 py-2.5 font-mono text-[13px] font-medium text-white"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
