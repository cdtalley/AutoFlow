"use client";

import { useMemo, useState } from "react";
import { LiveRunsPanel } from "@/components/dashboard/LiveRunsPanel";
import { MetricsSidebar } from "@/components/dashboard/MetricsSidebar";
import { RunHistoryPanel } from "@/components/dashboard/RunHistoryPanel";
import { SubmitInquiryPanel, type InquiryFormState } from "@/components/dashboard/SubmitInquiryPanel";
import { TabButton } from "@/components/dashboard/FormControls";
import { useLiveRun } from "@/hooks/useLiveRun";
import { useSidebarData } from "@/hooks/useSidebarData";
import { createInquiry, getRunDetails } from "@/lib/api";
import { humanizeApiError } from "@/lib/http";
import type { RunStatus, RunStatusValue } from "@/lib/types";

type Tab = "submit" | "live" | "history";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("submit");
  const [watchRunId, setWatchRunId] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | RunStatusValue>("all");
  const [selectedRun, setSelectedRun] = useState<RunStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<InquiryFormState>({
    sender_name: "",
    sender_email: "",
    subject: "",
    body: "",
    metadata: "{}",
  });

  const { health, runs, loadError, isHydrating, reload } = useSidebarData();
  const { liveRun, liveSteps, refresh } = useLiveRun(activeTab === "live" ? watchRunId : "");

  const filteredRuns = useMemo(
    () => runs.filter((r) => (historyFilter === "all" ? true : r.status === historyFilter)),
    [runs, historyFilter],
  );

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
      await reload();
    } catch (e) {
      setFormError(humanizeApiError(e));
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const detail = await getRunDetails(runId);
      setSelectedRun(detail);
    } catch (e) {
      setFormError(humanizeApiError(e));
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-12 gap-5 p-6">
      <MetricsSidebar health={health} runs={runs} loadError={loadError} isHydrating={isHydrating} />

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

        {activeTab === "submit" && (
          <SubmitInquiryPanel form={form} setForm={setForm} error={formError} onSubmit={() => void submitInquiry()} />
        )}

        {activeTab === "live" && (
          <LiveRunsPanel
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
          />
        )}
      </section>
    </main>
  );
}
