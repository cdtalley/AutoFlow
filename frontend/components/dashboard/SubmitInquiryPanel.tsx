import { Send } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Input, TextArea } from "@/components/dashboard/FormControls";

export type InquiryFormState = {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  metadata: string;
};

export function SubmitInquiryPanel({
  form,
  setForm,
  error,
  onSubmit,
}: {
  form: InquiryFormState;
  setForm: Dispatch<SetStateAction<InquiryFormState>>;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="panel space-y-4 p-5">
      <h2 className="text-xl font-semibold">Submit New Inquiry</h2>
      {error && <p className="rounded-lg border border-red-400/30 bg-red-900/20 p-3 text-sm text-red-200">{error}</p>}
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
        type="button"
        onClick={onSubmit}
        className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
      >
        <Send size={16} />
        Launch Workflow
      </button>
    </div>
  );
}
