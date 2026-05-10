"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { buildSiteConfig, type SiteConfig } from "@/lib/siteConfig";

const SiteConfigContext = createContext<SiteConfig | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => buildSiteConfig(), []);
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error("useSiteConfig must be used within SiteConfigProvider");
  }
  return ctx;
}
