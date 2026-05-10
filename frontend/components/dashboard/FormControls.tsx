import clsx from "clsx";
import type { ReactNode } from "react";

export function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
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

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
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

export function Input({
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

export function TextArea({
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
