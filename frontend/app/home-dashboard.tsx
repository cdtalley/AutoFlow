"use client";

import { useEffect, useMemo, useState } from "react";
import { useSiteConfig } from "@/app/providers";
import { AppShell } from "@/components/dashboard/AppShell";
import { LiveRunsPanel } from "@/components/dashboard/LiveRunsPanel";
import { MetricsSidebar } from "@/components/dashboard/MetricsSidebar";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { RunHistoryPanel } from "@/components/dashboard/RunHistoryPanel";
import { SubmitInquiryPanel, type InquiryFormState } from "@/components/dashboard/SubmitInquiryPanel";
import { TabButton } from "@/components/dashboard/FormControls";
import { useLiveRun } from "@/hooks/useLiveRun";
import { useSidebarData } from "@/hooks/useSidebarData";
import { createInquiry, getRunDetails } from "@/lib/api";
import { PORTFOLIO_DEMO_INQUIRY } from "@/lib/demoPayload";
import { humanizeApiError } from "@/lib/http";
import type { RunStatus, RunStatusValue } from "@/lib/types";

type Tab = "overview" | "submit" | "live" | "history";

function isTab(v: string | undefined): v is Tab {
  return v === "overview" || v === "submit" || v === "live" || v === "history";
}

export default function HomeDashboard({
  portfolioThumb,
  initialRunId,
  initialTab,
}: {
  portfolioThumb: boolean;
  initialRunId?: string;
  initialTab?: string;
}) {
  const cfg = useSiteConfig();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (initialRunId) return "live";
    if (isTab(initialTab)) return initialTab;
    return cfg.defaultTab;
  });
  const [watchRunId, setWatchRunId] = useState(() => initialRunId ?? "");
  const [historyFilter, setHistoryFilter] = useState<"all" | RunStatusValue>("all");
  const [selectedRun, setSelectedRun] = useState<RunStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [form, setForm] = useState<InquiryFormState>({
    sender_name: "",
    sender_email: "",
    subject: "",
    body: "",
    metadata: "{}",
  });

  const { health, runs, loadError, isHydrating, reload } = useSidebarData();
  const { liveRun, liveSteps, refresh } = useLiveRun(activeTab === "live" ? watchRunId : "");

  /** Client-only URL sync (static export, back/forward, or links without full navigation). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const run = sp.get("run");
    const tab = sp.get("tab");
    if (run) {
      setWatchRunId(run);
      setActiveTab("live");
      return;
    }
    if (tab && isTab(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const filteredRuns = useMemo(
    () => runs.filter((r) => (historyFilter === "all" ? true : r.status === historyFilter)),
    [runs, historyFilter],
  );

  const manualReload = async () => {
    setRefreshBusy(true);
    try {
      await reload();
    } finally {
      setRefreshBusy(false);
    }
  };

  const runFullDemo = async () => {
    setDemoBusy(true);
    setFormError(null);
    try {
      const response = await createInquiry(PORTFOLIO_DEMO_INQUIRY);
      setWatchRunId(response.run_id);
      setActiveTab("live");
      await reload();
      await refresh(response.run_id);
    } catch (e) {
      setFormError(humanizeApiError(e));
    } finally {
      setDemoBusy(false);
    }
  };

  const submitInquiry = async () => {
    setFormError(null);
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
      setFormError(null);
      await reload();
      await refresh(response.run_id);
    } catch (e) {
      setFormError(humanizeApiError(e));
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const detail = await getRunDetails(runId);
      setSelectedRun(detail);
      setFormError(null);
    } catch (e) {
      setFormError(humanizeApiError(e));
    }
  };

  return (
    <AppShell onRefresh={manualReload} isRefreshing={refreshBusy}>
      <main
        data-testid="portfolio-dashboard-frame"
        className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start"
      >
        <MetricsSidebar health={health} runs={runs} loadError={loadError} isHydrating={isHydrating} />

        <section className="space-y-5 xl:col-span-9" data-testid="portfolio-main-column">
          {formError && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100"
            >
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/20"
              >
                Dismiss
              </button>
            </div>
          )}
          <nav className="panel flex flex-wrap gap-1 p-1.5 sm:inline-flex sm:rounded-2xl">
            <TabButton testId="nav-overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              Start here
            </TabButton>
            <TabButton testId="nav-submit" active={activeTab === "submit"} onClick={() => setActiveTab("submit")}>
              Submit
            </TabButton>
            <TabButton testId="nav-live" active={activeTab === "live"} onClick={() => setActiveTab("live")}>
              Live run
            </TabButton>
            <TabButton testId="nav-history" active={activeTab === "history"} onClick={() => setActiveTab("history")}>
              History
            </TabButton>
          </nav>

          {activeTab === "overview" && (
            <OverviewPanel
              health={health}
              loadError={loadError}
              isHydrating={isHydrating}
              runsCount={runs.length}
              onRunFullDemo={runFullDemo}
              demoBusy={demoBusy}
              onGoSubmit={() => setActiveTab("submit")}
              onGoHistory={() => setActiveTab("history")}
            />
          )}

          {activeTab === "submit" && (
            <SubmitInquiryPanel form={form} setForm={setForm} onSubmit={() => void submitInquiry()} />
          )}

          {activeTab === "live" && (
            <LiveRunsPanel
              portfolioThumb={portfolioThumb}
              watchRunId={watchRunId}
              setWatchRunId={setWatchRunId}
              liveRun={liveRun}
              liveSteps={liveSteps}
              onConnect={refresh}
            />
          )}

          {activeTab === "history" && (
            <RunHistoryPanel
              filteredRuns={filteredRuns}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              selectedRun={selectedRun}
              onSelectRun={(id) => void loadRunDetails(id)}
              onRunDemo={runFullDemo}
              demoBusy={demoBusy}
              totalRunCount={runs.length}
            />
          )}
        </section>
      </main>
    </AppShell>
  );
}
