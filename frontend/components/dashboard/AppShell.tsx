"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useSiteConfig } from "@/app/providers";
import { getApiBase } from "@/lib/http";

export function AppShell({
  children,
  onRefresh,
  isRefreshing,
}: {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  isRefreshing?: boolean;
}) {
  const cfg = useSiteConfig();
  const api = getApiBase();

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]"
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b ${cfg.accent.heroGradient} opacity-90 blur-3xl`}
        aria-hidden
      />

      <header className="relative border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${cfg.accent.heroGradient} shadow-lg`}
            >
              <Sparkles className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{cfg.appName}</h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.accent.pill}`}
                >
                  {cfg.environmentLabel}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{cfg.tagline}</p>
              {cfg.showApiEndpointBadge && (
                <p className="mt-2 font-mono text-[11px] text-slate-500">
                  API <span className="text-slate-400">{api}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-inner transition hover:bg-white/10 disabled:opacity-50 ${cfg.accent.glow} focus-visible:outline-none focus-visible:ring-2`}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh data
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1680px] px-5 py-8 sm:px-8">{children}</div>

      {cfg.showFooterAttribution && (
        <footer className="relative mt-12 border-t border-white/5 py-8 text-center text-xs text-slate-500">
          <p>
            {cfg.controlCenterLabel} · {cfg.appName}
            {cfg.supportUrl && (
              <>
                {" · "}
                <a href={cfg.supportUrl} className="text-slate-400 underline-offset-2 hover:text-sky-300 hover:underline">
                  Support
                </a>
              </>
            )}
            {cfg.docsUrl && (
              <>
                {" · "}
                <a href={cfg.docsUrl} className="text-slate-400 underline-offset-2 hover:text-sky-300 hover:underline">
                  Documentation
                </a>
              </>
            )}
          </p>
        </footer>
      )}
    </div>
  );
}
