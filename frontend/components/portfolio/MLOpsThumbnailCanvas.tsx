"use client";

import type { CSSProperties } from "react";

/**
 * MLOps catalog thumbnail — static canvas for Playwright capture (1000×750).
 * copy emphasizes serving, lineage, CI, and health-gated ops.
 */
const TAGS = [
  "FastAPI",
  "LangGraph",
  "Ollama",
  "Postgres",
  "Redis",
  "Docker",
  "GitHub Actions",
] as const;

const CATALOG_METRICS: { value: string; label: string }[] = [
  { value: "CI", label: "AUTOMATED TESTS" },
  { value: "/health", label: "LB-READY PROBES" },
  { value: "run_id", label: "LINEAGE PER REQUEST" },
  { value: "Async", label: "NON-BLOCKING SERVE" },
];

const mono: CSSProperties = {
  fontFamily: "var(--font-portfolio-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export default function MLOpsThumbnailCanvas({ runId: _runId }: { runId: string | null }) {
  return (
    <div
      data-testid="portfolio-mlops-thumb-ready"
      data-ready="1"
      className="relative box-border h-[750px] w-[1000px] overflow-hidden rounded-[20px] border border-cyan-400/35 text-[#e2e8f0] shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_60px_-8px_rgba(34,211,238,0.18),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      style={{ fontFamily: "var(--font-portfolio-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-[#0a192f]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 55% at 8% 100%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 88% 60% at 94% 4%, rgba(30, 78, 130, 0.48) 0%, transparent 52%),
            linear-gradient(168deg, #0a192f 0%, #071422 55%, #050c18 100%)
          `,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -right-32 top-1/2 h-[620px] w-[620px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 42%, rgba(56, 189, 248, 0.08) 0%, rgba(14, 116, 144, 0.04) 38%, transparent 72%)",
          border: "1px solid rgba(56, 189, 248, 0.07)",
        }}
        aria-hidden
      />

      <div className="portfolio-catalog-grid pointer-events-none absolute inset-0 opacity-[0.88]" aria-hidden />

      <div className="relative flex h-full w-full flex-col pl-[3.5rem] pr-[3rem] pb-10 pt-[3.75rem]">
        <p className="text-[10.5px] font-bold uppercase leading-none tracking-[0.42em] text-cyan-400">
          MLOPS REFERENCE
        </p>

        <h1 className="mt-[1.35rem] max-w-[58rem] text-[2.75rem] font-bold leading-[1.06] tracking-[-0.032em]">
          <span className="text-white">AutoFlow</span>
          <span className="text-cyan-400"> — LLM app platform</span>
        </h1>

        <p className="mt-[1.15rem] max-w-[56rem] text-[14.5px] font-normal leading-[1.6] text-[#94a3b8]">
          Serving · orchestration · run lineage · idempotent ingest · health probes · CI gates · operator console
        </p>

        <div className="mt-[2.35rem] grid w-[472px] shrink-0 grid-cols-2 gap-[17px]">
          {CATALOG_METRICS.map((c) => (
            <div
              key={`${c.value}-${c.label}`}
              className="rounded-[14px] border border-cyan-500/30 bg-[#0c2138]/75 px-[22px] pb-[20px] pt-[22px]"
              style={{
                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p className="text-[2.125rem] font-bold leading-none tracking-[-0.02em] text-white">{c.value}</p>
              <p className="mt-[14px] text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] text-[#64748b]">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-[2.1rem] flex max-w-[56rem] flex-wrap gap-[10px]">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-[7px] border border-cyan-400/60 bg-[#040d18] px-[14px] py-[9px] text-[13px] font-medium leading-none text-white"
              style={mono}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
