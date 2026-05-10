/**
 * Portfolio screenshot: POST demo webhook, wait for graph progress, then capture
 * Live run (agent steps) or History (table rows). Run from repo `frontend/` with API + UI up.
 *
 * Env:
 *   PLAYWRIGHT_API_BASE   default http://127.0.0.1:8000
 *   PLAYWRIGHT_UI_BASE    default http://localhost:3000
 *   PLAYWRIGHT_SCREENSHOT_OUT  default ../../docs/images/upwork-dashboard.png
 *   PLAYWRIGHT_THUMB_OUT       default ../../docs/images/upwork-thumbnail.png (1000×750 viewport)
 *   PLAYWRIGHT_WEBHOOK_API_KEY  optional; must match backend WEBHOOK_API_KEY
 *
 * Upwork: **upwork-thumbnail.png** is exactly **1000×750** from `/portfolio/upwork?run=…` — a dedicated
 * hook + live-trace canvas (no crop). Full-page **upwork-dashboard.png** is the real operator UI.
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.PLAYWRIGHT_API_BASE || "http://127.0.0.1:8000";
const UI_BASE = (process.env.PLAYWRIGHT_UI_BASE || "http://localhost:3000").replace(/\/$/, "");
const OUT =
  process.env.PLAYWRIGHT_SCREENSHOT_OUT ||
  path.join(__dirname, "..", "..", "docs", "images", "upwork-dashboard.png");
const THUMB_W = 1000;
const THUMB_H = 750;
const WEBHOOK_KEY =
  process.env.PLAYWRIGHT_WEBHOOK_API_KEY ||
  process.env.WEBHOOK_API_KEY ||
  "";

/** Mirrors `frontend/lib/demoPayload.ts` — keep in sync for identical portfolio demo. */
const PORTFOLIO_DEMO_INQUIRY = {
  sender_name: "Morgan Blake",
  sender_email: "morgan.portfolio@example.com",
  subject: "SOC2 path + 500-seat rollout — technical evaluation",
  body: `We're shortlisting automation vendors for regulated inbound mail.

Must-haves:
• Typed HTTP ingress with rate limits and idempotency
• Explicit multi-agent graph (not a single mega-prompt)
• Durable audit trail in Postgres + fast status in Redis
• Local / air-gapped LLM option for PII-heavy phases

If you support escalation with human-readable reasons, describe how your handoff payload looks.`,
  metadata: { source: "portfolio_demo", segment: "enterprise", review: true },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postWebhook() {
  const headers = { "Content-Type": "application/json" };
  if (WEBHOOK_KEY) headers["X-API-Key"] = WEBHOOK_KEY;
  const res = await fetch(`${API_BASE}/api/v1/webhook`, {
    method: "POST",
    headers,
    body: JSON.stringify(PORTFOLIO_DEMO_INQUIRY),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`POST /api/v1/webhook failed ${res.status}: ${t.slice(0, 500)}`);
  }
  const j = await res.json();
  const runId = j.run_id;
  if (!runId) throw new Error("Webhook JSON missing run_id");
  return runId;
}

async function fetchStatus(runId) {
  const res = await fetch(`${API_BASE}/api/v1/status/${encodeURIComponent(runId)}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Wait until we have enough steps for a compelling screenshot, or run finished, or timeout.
 */
async function waitForGraph(runId, maxMs) {
  const deadline = Date.now() + maxMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await fetchStatus(runId);
    if (!last) {
      await sleep(1500);
      continue;
    }
    const steps = last.agent_steps || [];
    const n = steps.length;
    const term = ["completed", "escalated", "error"].includes(last.status);
    if (n >= 2) return { last, preferLive: true };
    if (term && n >= 1) return { last, preferLive: true };
    if (term) return { last, preferLive: false };
    await sleep(2000);
  }
  const steps = (last?.agent_steps || []).length;
  return { last, preferLive: steps >= 1 };
}

async function main() {
  console.log("Posting portfolio demo webhook…");
  const runId = await postWebhook();
  console.log("run_id:", runId);
  console.log("Waiting for graph (up to 100s)…");
  const { last, preferLive } = await waitForGraph(runId, 100_000);
  const stepCount = (last?.agent_steps || []).length;
  console.log("status:", last?.status, "agent_steps:", stepCount, "preferLive:", preferLive);

  const dir = path.dirname(OUT);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const THUMB_OUT =
    process.env.PLAYWRIGHT_THUMB_OUT || path.join(dir, "upwork-thumbnail.png");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  try {
    let captureUrl;
    if (preferLive && stepCount >= 1) {
      captureUrl = `${UI_BASE}/?tab=live&run=${encodeURIComponent(runId)}`;
      console.log("Opening", captureUrl);
      await page.goto(captureUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page
        .waitForSelector('[data-testid="agent-step"]', { timeout: 45_000 })
        .catch(() => console.warn("No agent-step selector yet; capturing anyway."));
      await sleep(4000);
    } else {
      captureUrl = `${UI_BASE}/?tab=history`;
      console.log("Opening history fallback:", captureUrl);
      await page.goto(captureUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page
        .waitForSelector('[data-testid="history-table-row"]', { timeout: 45_000 })
        .catch(() => console.warn("No history rows yet; capturing anyway."));
      await sleep(3000);
    }

    await page.screenshot({ path: OUT, fullPage: true });
    console.log("Wrote", OUT);

    /** Dedicated 1000×750 portfolio canvas — headline + trace + stack (fits Upwork 4:3). */
    const thumbUrl = `${UI_BASE}/portfolio/upwork?run=${encodeURIComponent(runId)}`;
    console.log("Thumbnail canvas", thumbUrl);
    await page.setViewportSize({ width: THUMB_W, height: THUMB_H });
    await page.goto(thumbUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page
      .waitForSelector('[data-testid="portfolio-upwork-thumb-ready"][data-ready="1"]', { timeout: 30_000 })
      .catch(() => console.warn("Thumbnail ready marker missing — check API/CORS for /status from browser."));
    await sleep(1200);
    await page.screenshot({ path: THUMB_OUT, fullPage: false, type: "png" });
    console.log("Wrote", THUMB_OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
