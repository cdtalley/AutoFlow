"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useSiteConfig } from "@/app/providers";

export function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3.5 shadow-inner transition hover:border-white/15">
      <div className="flex items-center justify-between text-slate-500">
        <p className="text-[11px] font-medium uppercase tracking-wide">{title}</p>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
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
  const { accent } = useSiteConfig();
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
        accent.glow,
        active
          ? clsx(accent.primary, accent.primaryHover, "text-slate-950 shadow-lg")
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
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
  const { accent } = useSiteConfig();
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx("input-field", accent.glow)}
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
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const { accent } = useSiteConfig();
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      ) : null}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx("input-field min-h-[120px] resize-y", accent.glow)}
      />
    </label>
  );
}
