import { useCallback, useEffect, useState } from "react";
import { getRun, getWebSocketUrl } from "@/lib/api";
import type { AgentStep, RunStatus } from "@/lib/types";

function parseWsPayload(raw: string): { state?: RunStatus } | null {
  try {
    return JSON.parse(raw) as { state?: RunStatus };
  } catch {
    return null;
  }
}

export function useLiveRun(watchRunId: string, pollMs = 2000) {
  const [liveRun, setLiveRun] = useState<RunStatus | null>(null);
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]);

  const refresh = useCallback(async () => {
    if (!watchRunId.trim()) return;
    const data = await getRun(watchRunId.trim());
    setLiveRun(data);
    setLiveSteps(data.agent_steps ?? []);
  }, [watchRunId]);

  useEffect(() => {
    if (!watchRunId.trim()) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketUrl(watchRunId.trim()));
      ws.onmessage = (event) => {
        const payload = parseWsPayload(event.data);
        if (payload?.state) {
          setLiveRun(payload.state);
          setLiveSteps(payload.state.agent_steps ?? []);
        }
      };
    } catch {
      /* polling only */
    }
    return () => ws?.close();
  }, [watchRunId]);

  useEffect(() => {
    if (!watchRunId.trim()) return;
    const id = setInterval(() => {
      void (async () => {
        try {
          await refresh();
        } catch {
          /* transient */
        }
      })();
    }, pollMs);
    return () => clearInterval(id);
  }, [watchRunId, pollMs, refresh]);

  return { liveRun, liveSteps, refresh };
}
