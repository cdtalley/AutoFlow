/**
 * White-label / demo configuration via NEXT_PUBLIC_* env vars (baked at build time).
 * Copy `.env.example` → `.env.local` and adjust for each deployment or client demo.
 */

export type AccentId = "sky" | "violet" | "teal" | "amber";

export type DefaultTab = "submit" | "live" | "history";

export type SiteAccent = {
  id: AccentId;
  /** Primary CTA / active tab */
  primary: string;
  primaryHover: string;
  /** Subtle glow on focus/hover for chrome */
  glow: string;
  /** Chart single-series fill */
  chartFill: string;
  /** Gradient for hero / header stripe (Tailwind classes) */
  heroGradient: string;
  /** Badge / pill for “connected” states */
  pill: string;
};

const ACCENTS: Record<AccentId, SiteAccent> = {
  sky: {
    id: "sky",
    primary: "bg-sky-500 hover:bg-sky-400",
    primaryHover: "hover:shadow-sky-500/30",
    glow: "focus-visible:ring-sky-400/60",
    chartFill: "#38bdf8",
    heroGradient: "from-sky-600/90 via-cyan-600/50 to-indigo-900/30",
    pill: "border-sky-500/35 bg-sky-500/10 text-sky-100",
  },
  violet: {
    id: "violet",
    primary: "bg-violet-500 hover:bg-violet-400",
    primaryHover: "hover:shadow-violet-500/30",
    glow: "focus-visible:ring-violet-400/60",
    chartFill: "#a78bfa",
    heroGradient: "from-violet-600/90 via-fuchsia-600/40 to-slate-900/30",
    pill: "border-violet-500/35 bg-violet-500/10 text-violet-100",
  },
  teal: {
    id: "teal",
    primary: "bg-teal-500 hover:bg-teal-400",
    primaryHover: "hover:shadow-teal-500/30",
    glow: "focus-visible:ring-teal-400/60",
    chartFill: "#2dd4bf",
    heroGradient: "from-teal-600/90 via-emerald-600/45 to-slate-900/30",
    pill: "border-teal-500/35 bg-teal-500/10 text-teal-100",
  },
  amber: {
    id: "amber",
    primary: "bg-amber-500 hover:bg-amber-400",
    primaryHover: "hover:shadow-amber-500/30",
    glow: "focus-visible:ring-amber-400/60",
    chartFill: "#fbbf24",
    heroGradient: "from-amber-600/85 via-orange-600/40 to-slate-900/30",
    pill: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  },
};

function readEnv(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const v = process.env[key];
  return v !== undefined && v.trim() !== "" ? v.trim() : undefined;
}

function parseAccent(raw: string | undefined): AccentId {
  const id = (raw || "sky").toLowerCase() as AccentId;
  return id in ACCENTS ? id : "sky";
}

function parseDefaultTab(raw: string | undefined): DefaultTab {
  const v = (raw || "submit").toLowerCase();
  if (v === "live" || v === "history" || v === "submit") return v;
  return "submit";
}

function parseBool(raw: string | undefined, defaultTrue: boolean): boolean {
  if (raw === undefined) return defaultTrue;
  const v = raw.toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  return defaultTrue;
}

export type SiteConfig = {
  appName: string;
  tagline: string;
  controlCenterLabel: string;
  environmentLabel: string;
  accent: SiteAccent;
  defaultTab: DefaultTab;
  showDemoPresets: boolean;
  showApiEndpointBadge: boolean;
  showFooterAttribution: boolean;
  supportUrl: string | null;
  docsUrl: string | null;
};

export function buildSiteConfig(): SiteConfig {
  const accentId = parseAccent(readEnv("NEXT_PUBLIC_UI_ACCENT"));
  return {
    appName: readEnv("NEXT_PUBLIC_APP_NAME") ?? "AutoFlow",
    tagline: readEnv("NEXT_PUBLIC_APP_TAGLINE") ?? "Multi-agent inquiry automation — classify, route, respond, escalate.",
    controlCenterLabel: readEnv("NEXT_PUBLIC_CONTROL_CENTER_LABEL") ?? "Control Center",
    environmentLabel: readEnv("NEXT_PUBLIC_ENVIRONMENT_LABEL") ?? "Demo",
    accent: ACCENTS[accentId],
    defaultTab: parseDefaultTab(readEnv("NEXT_PUBLIC_DEFAULT_TAB")),
    showDemoPresets: parseBool(readEnv("NEXT_PUBLIC_SHOW_DEMO_PRESETS"), true),
    showApiEndpointBadge: parseBool(readEnv("NEXT_PUBLIC_SHOW_API_ENDPOINT_BADGE"), true),
    showFooterAttribution: parseBool(readEnv("NEXT_PUBLIC_SHOW_FOOTER_ATTRIBUTION"), true),
    supportUrl: readEnv("NEXT_PUBLIC_SUPPORT_URL") ?? null,
    docsUrl: readEnv("NEXT_PUBLIC_DOCS_URL") ?? null,
  };
}
