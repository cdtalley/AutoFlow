import { useCallback, useEffect, useState } from "react";
import { getHealth, getRuns } from "@/lib/api";
import { humanizeApiError } from "@/lib/http";
import type { RunListItem } from "@/lib/types";

export function useSidebarData(pollMs = 8000) {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoadError(null);
      const [h, r] = await Promise.all([getHealth(), getRuns()]);
      setHealth(h);
      setRuns(r);
    } catch (e) {
      setLoadError(humanizeApiError(e));
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), pollMs);
    return () => clearInterval(id);
  }, [reload, pollMs]);

  return { health, runs, loadError, isHydrating, reload };
}
