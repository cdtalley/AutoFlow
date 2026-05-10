"use client";

import { ChevronRight, Send, Zap } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useSiteConfig } from "@/app/providers";
import { Input, TextArea } from "@/components/dashboard/FormControls";
import { PORTFOLIO_DEMO_INQUIRY } from "@/lib/demoPayload";

export type InquiryFormState = {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  metadata: string;
};

const PRESETS: { label: string; hint: string; patch: Partial<InquiryFormState> }[] = [
  {
    label: "Reviewer demo",
    hint: "Same as Start here",
    patch: {
      sender_name: PORTFOLIO_DEMO_INQUIRY.sender_name,
      sender_email: PORTFOLIO_DEMO_INQUIRY.sender_email,
      subject: PORTFOLIO_DEMO_INQUIRY.subject,
      body: PORTFOLIO_DEMO_INQUIRY.body,
      metadata: JSON.stringify(PORTFOLIO_DEMO_INQUIRY.metadata, null, 2),
    },
  },
  {
    label: "Enterprise",
    hint: "SOC2 + pricing",
    patch: {
      sender_name: "Alex Rivera",
      sender_email: "alex.rivera@example.com",
      subject: "Annual pricing and SOC2 package",
      body: "We need SOC2 documentation, SSO, and annual pricing for 120 seats. Security review next week.",
      metadata: '{"source":"demo","tier":"enterprise"}',
    },
  },
  {
    label: "Sales",
    hint: "Demo request",
    patch: {
      sender_name: "Jordan Lee",
      sender_email: "jordan.lee@example.com",
      subject: "Enterprise demo this week",
      body: "We have 400 users and need a security questionnaire filled plus a 30-minute technical demo.",
      metadata: '{"source":"demo"}',
    },
  },
  {
    label: "Support",
    hint: "Urgent",
    patch: {
      sender_name: "Casey Morgan",
      sender_email: "casey.morgan@example.com",
      subject: "Critical: export failing on large CSV",
      body: "Dashboard export errors above 50k rows. Production blocked — need a workaround today.",
      metadata: '{"source":"demo","priority":"high"}',
    },
  },
];

export function SubmitInquiryPanel({
  form,
  setForm,
  onSubmit,
}: {
  form: InquiryFormState;
  setForm: Dispatch<SetStateAction<InquiryFormState>>;
  onSubmit: () => void;
}) {
  const cfg = useSiteConfig();
  const applyPreset = (patch: Partial<InquiryFormState>) => {
    setForm((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="panel overflow-hidden">
      <div className={`border-b border-white/5 bg-gradient-to-r px-6 py-5 sm:px-8 ${cfg.accent.heroGradient}`}>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">New inquiry</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Launch a workflow</h2>
            <p className="mt-1 max-w-xl text-sm text-white/75">
              Same payload as{" "}
              <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-xs">POST /api/v1/webhook</code> — drives
              LangGraph classification and specialist agents.
            </p>
          </div>
          {cfg.showDemoPresets && (
            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.patch)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/35 hover:bg-black/30"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <span>
                    <span className="block font-semibold">{p.label}</span>
                    <span className="block text-[10px] font-normal text-white/60">{p.hint}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.sender_name} onChange={(v) => setForm((s) => ({ ...s, sender_name: v }))} />
          <Input label="Email" value={form.sender_email} onChange={(v) => setForm((s) => ({ ...s, sender_email: v }))} />
        </div>
        <Input label="Subject" value={form.subject} onChange={(v) => setForm((s) => ({ ...s, subject: v }))} />
        <TextArea label="Body" value={form.body} onChange={(v) => setForm((s) => ({ ...s, body: v }))} rows={7} />
        <details className="panel-inset overflow-hidden">
          <summary className="cursor-pointer select-none px-4 py-3 text-xs font-semibold text-slate-400 transition hover:text-slate-300">
            Advanced · metadata JSON
          </summary>
          <div className="border-t border-white/5 px-4 pb-4 pt-2">
            <TextArea value={form.metadata} onChange={(v) => setForm((s) => ({ ...s, metadata: v }))} rows={5} />
          </div>
        </details>
        <button
          type="button"
          onClick={onSubmit}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition sm:w-auto ${cfg.accent.primary} ${cfg.accent.primaryHover}`}
        >
          <Send className="h-4 w-4" strokeWidth={2.5} />
          Launch workflow
        </button>
      </div>
    </div>
  );
}
