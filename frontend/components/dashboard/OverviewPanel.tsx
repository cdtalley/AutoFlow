"use client";

import clsx from "clsx";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  Github,
  Loader2,
  Play,
  Radio,
  Server,
  Shield,
  Sparkles,
  Star,
  Workflow,
  Zap,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useSiteConfig } from "@/app/providers";
import { getApiBase } from "@/lib/http";

const STACK = ["FastAPI", "LangGraph", "Ollama", "PostgreSQL", "Redis", "Next.js"] as const;

const BASH_BOOT = String.raw`docker compose up redis postgres -d
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000`;

function FlowPipeline({ accentClass }: { accentClass: string }) {
  const nodes = [
    { icon: Radio, label: "Webhook", sub: "POST /api/v1/webhook" },
    { icon: Workflow, label: "LangGraph", sub: "Classify → branch" },
    { icon: Zap, label: "Ollama", sub: "Local LLM" },
    { icon: Database, label: "Postgres + Redis", sub: "Durable + live" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-6 sm:p-8">
      <div className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${accentClass} opacity-20 blur-3xl`} />
      <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Architecture at a glance</p>
      <div className="relative mt-6 flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:justify-center md:gap-1">
        {nodes.map((n, i) => (
          <Fragment key={n.label}>
            <div className="flex w-full max-w-[200px] flex-col items-center px-2 text-center md:w-auto md:flex-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner ring-1 ring-white/10">
                <n.icon className="h-6 w-6 text-slate-200" strokeWidth={1.35} />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{n.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{n.sub}</p>
            </div>
            {i < nodes.length - 1 && (
              <ArrowRight
                className="my-1 h-4 w-4 shrink-0 rotate-90 text-white/20 md:my-0 md:mt-7 md:rotate-0 md:self-start"
                aria-hidden
              />
            )}
          </Fragment>
        ))}
      </div>
      <p className="relative mt-6 text-center text-[11px] leading-relaxed text-slate-500">
        Workers run the graph; this UI polls <code className="text-slate-400">/status</code> and loads runs from <code className="text-slate-400">/runs</code>.
      </p>
    </div>
  );
}

export function OverviewPanel({
  health,
  loadError,
  isHydrating,
  runsCount,
  onRunFullDemo,
  demoBusy,
  onGoSubmit,
  onGoHistory,
}: {
  health: Record<string, unknown> | null;
  loadError: string | null;
  isHydrating: boolean;
  runsCount: number;
  onRunFullDemo: () => void | Promise<void>;
  demoBusy: boolean;
  onGoSubmit: () => void;
  onGoHistory: () => void;
}) {
  const cfg = useSiteConfig();
  const api = getApiBase();
  const [bootOpen, setBootOpen] = useState(false);

  const apiLive = health !== null && loadError === null;
  const degraded = health !== null && health["status"] === "degraded";
  /** Health check succeeded — webhook can be tried even if sidebar refresh partially failed */
  const readyForDemo = !isHydrating && health !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-400 sm:justify-start">
          <span className="inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
            Optional API keys, idempotent webhook
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 shrink-0 fill-amber-400/30 text-amber-400/90" aria-hidden />
            LangGraph + Ollama (local inference)
          </span>
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4 shrink-0 text-sky-400/90" aria-hidden />
            Redis + Postgres
          </span>
        </div>
      </div>

      <div className="frame-glow">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-slate-950/92 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cfg.accent.heroGradient} opacity-[0.12]`} />
          <div className="relative max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/85 shadow-inner">
              <Sparkles className="h-3 w-3 text-amber-200/90" />
              Demo console
            </p>
            <h2 className="mt-5 bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl sm:leading-tight">
              What {cfg.appName} is
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              Webhook intake, LangGraph routing, Redis for live run state, Postgres for history, structured errors with{" "}
              <code className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-sm text-sky-200/90">request_id</code>. The UI polls{" "}
              <code className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-sm text-sky-200/90">/status</code> and degrades cleanly when the API is down.
            </p>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Webhook hardening",
              body: "Rate limits, optional X-API-Key, Idempotency-Key, OpenAPI security metadata.",
            },
            {
              icon: Server,
              title: "Split persistence",
              body: "Redis for hot run state; Postgres for disputes, reporting, and history.",
            },
            {
              icon: BookOpen,
              title: "Graph + steps",
              body: "LangGraph branches by intent; each step is stored for audit.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-inner backdrop-blur-sm transition hover:border-white/15 hover:bg-black/40"
            >
              <c.icon className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-white">{c.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.body}</p>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Stack */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Stack</span>
        {STACK.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300"
          >
            {t}
          </span>
        ))}
        {cfg.repoUrl && (
          <a
            href={cfg.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <Github className="h-3.5 w-3.5" />
            View source
          </a>
        )}
      </div>

      <FlowPipeline accentClass={cfg.accent.heroGradient} />

      {/* API status + demo CTA */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="panel space-y-4 p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Backend status</h3>
          {isHydrating && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reaching <code className="font-mono text-xs text-slate-500">{api}</code>…
            </div>
          )}
          {!isHydrating && health === null && (
            <div className="space-y-3 text-sm text-slate-400">
              <p className="font-medium text-amber-200/90">API not reachable from this browser.</p>
              <p className="text-xs leading-relaxed text-slate-500">
                This is normal before you boot the stack. The UI still renders so you can review layout and copy — then connect the API to run the
                one-click demo.
              </p>
            </div>
          )}
          {!isHydrating && health !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300/90">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                API reachable — {degraded ? "degraded (check Redis/DB in /health)" : "core checks passed"}
              </div>
              <p className="text-xs text-slate-500">
                {runsCount} run(s) listed{loadError && !apiLive ? " · runs list refresh had an issue — demo POST may still work" : ""}.
              </p>
            </div>
          )}
          {loadError && health !== null && (
            <p className="text-xs text-amber-200/80">Partial: {loadError}</p>
          )}

          <button
            type="button"
            onClick={() => setBootOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
          >
            <span>Boot commands (copy / paste)</span>
            <ChevronDown className={clsx("h-4 w-4 transition", bootOpen && "rotate-180")} />
          </button>
          {bootOpen && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500">From repository root</p>
              <p className="text-[10px] text-slate-600">PowerShell / bash</p>
              <pre className="max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-slate-400">{BASH_BOOT}</pre>
              <p className="text-[10px] text-slate-600">Then open this UI — API defaults to port 8000.</p>
            </div>
          )}
        </div>

        <div className="relative panel flex flex-col justify-between overflow-hidden p-6 ring-1 ring-inset ring-white/10 lg:col-span-3">
          <div
            className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br ${cfg.accent.heroGradient} opacity-25 blur-3xl`}
            aria-hidden
          />
          <div className="relative">
            <h3 className="text-sm font-semibold text-white">Demo run</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              POSTs a sample inquiry to <code className="font-mono text-xs text-slate-500">/api/v1/webhook</code>, then switches to{" "}
              <strong className="text-slate-200">Live run</strong> so you can watch status and steps.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!readyForDemo || demoBusy}
              onClick={() => void onRunFullDemo()}
              className={clsx(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-slate-950 shadow-lg transition sm:flex-none",
                cfg.accent.primary,
                cfg.accent.primaryHover,
                readyForDemo && !demoBusy && "animate-cta-glow",
                (!readyForDemo || demoBusy) && "cursor-not-allowed opacity-40",
              )}
            >
              {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Run full demo
            </button>
            <button
              type="button"
              onClick={onGoSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Custom inquiry
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onGoHistory}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Run history
            </button>
          </div>
          {!readyForDemo && !isHydrating && (
            <p className="mt-3 text-[11px] text-slate-600">Start the API to enable the demo button.</p>
          )}
        </div>
      </div>

      <div className="panel-inset grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Structured 422 / 500 JSON",
          "Optional webhook + admin keys",
          "Per-IP rate limit (slowapi)",
          "WS + poll for run status",
        ].map((t) => (
          <div key={t} className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/80" />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
