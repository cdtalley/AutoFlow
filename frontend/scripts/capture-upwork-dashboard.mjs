/**
 * 1) Writes **docs/images/upwork-thumbnail.png** — ONLY the `/portfolio/upwork` DocuMind-style canvas (1000×750).
 * 2) Writes **docs/images/dashboard.png** — full operator UI when API + graph run exist.
 *
 * Thumbnail capture runs **first** and asserts the URL so you never save a stray Live-tab shot as the thumb.
 *
 * Env: PLAYWRIGHT_API_BASE, PLAYWRIGHT_UI_BASE, PLAYWRIGHT_RUN_ID (skip webhook if set),
 *      PLAYWRIGHT_WEBHOOK_API_KEY, PLAYWRIGHT_SCREENSHOT_OUT, PLAYWRIGHT_THUMB_OUT
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.PLAYWRIGHT_API_BASE || "http://127.0.0.1:8000";
const UI_BASE = (process.env.PLAYWRIGHT_UI_BASE || "http://localhost:3000").replace(/\/$/, "");
const OUT =
  process.env.PLAYWRIGHT_SCREENSHOT_OUT ||
  path.join(__dirname, "..", "..", "docs", "images", "dashboard.png");
const THUMB_W = 1000;
const THUMB_H = 750;
const WEBHOOK_KEY =
  process.env.PLAYWRIGHT_WEBHOOK_API_KEY ||
  process.env.WEBHOOK_API_KEY ||
  "";

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

/**
 * @param {import('playwright').Page} page
 * @param {string | null} runId
 * @param {string} thumbOut
 */
async function capturePortfolioThumb(page, runId, thumbOut) {
  const q = runId?.trim() ? `?run=${encodeURIComponent(runId.trim())}` : "";
  const thumbUrl = `${UI_BASE}/portfolio/upwork${q}`;
  console.log("Thumbnail (portfolio canvas only):", thumbUrl);
  await page.setViewportSize({ width: THUMB_W, height: THUMB_H });
  await page.goto(thumbUrl, { waitUntil: "load", timeout: 120_000 });

  const url = page.url();
  if (!/\/portfolio\/upwork/i.test(url)) {
    throw new Error(
      `Thumbnail must be /portfolio/upwork — got "${url}". Fix dev server or UI_BASE (use the same host the app uses).`,
    );
  }

  await page.waitForSelector('[data-testid="portfolio-upwork-thumb-ready"][data-ready="1"]', { timeout: 60_000 });

  const marker = await page.evaluate(() => {
    const t = document.body?.innerText ?? "";
    return (
      t.includes("REFERENCE STACK") &&
      t.includes("AutoFlow") &&
      t.includes("Multi-agent orchestrator")
    );
  });
  if (!marker) {
    throw new Error("Thumbnail page is not the catalog canvas (missing REFERENCE STACK / headline).");
  }

  await sleep(800);
  await page.screenshot({ path: thumbOut, fullPage: false, type: "png" });
  const bytes = readFileSync(thumbOut).length;
  if (bytes < 15_000) {
    throw new Error(`Thumbnail PNG too small (${bytes} b) — likely blank or wrong capture.`);
  }
  console.log("Wrote", thumbOut, `(${bytes} bytes)`);
}

async function main() {
  const dir = path.dirname(OUT);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const THUMB_OUT = process.env.PLAYWRIGHT_THUMB_OUT || path.join(dir, "upwork-thumbnail.png");

  let runId = process.env.PLAYWRIGHT_RUN_ID?.trim() || null;
  let preferLive = false;
  let stepCount = 0;

  if (runId) {
    try {
      const w = await waitForGraph(runId, 15_000);
      preferLive = w.preferLive;
      stepCount = (w.last?.agent_steps || []).length;
      console.log("PLAYWRIGHT_RUN_ID:", runId, "agent_steps:", stepCount, "preferLive:", preferLive);
    } catch {
      preferLive = true;
      stepCount = 1;
    }
  } else {
    try {
      console.log("Posting portfolio demo webhook…");
      runId = await postWebhook();
      console.log("run_id:", runId);
      console.log("Waiting for graph (up to 100s)…");
      const w = await waitForGraph(runId, 100_000);
      preferLive = w.preferLive;
      stepCount = (w.last?.agent_steps || []).length;
      console.log("status:", w.last?.status, "agent_steps:", stepCount, "preferLive:", preferLive);
    } catch (e) {
      console.warn("API offline or webhook failed — thumbnail will use static metrics (no ?run).", e.message);
      runId = null;
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await capturePortfolioThumb(page, runId, THUMB_OUT);

    if (!runId) {
      console.warn("Skipping full dashboard PNG — no run_id (start API and re-run, or set PLAYWRIGHT_RUN_ID).");
      return;
    }

    await page.setViewportSize({ width: 1600, height: 1000 });
    let captureUrl;
    if (preferLive && stepCount >= 1) {
      captureUrl = `${UI_BASE}/?tab=live&run=${encodeURIComponent(runId)}`;
      console.log("Dashboard:", captureUrl);
      await page.goto(captureUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page
        .waitForSelector('[data-testid="agent-step"]', { timeout: 45_000 })
        .catch(() => console.warn("No agent-step yet; capturing anyway."));
      await sleep(3500);
    } else {
      captureUrl = `${UI_BASE}/?tab=history`;
      console.log("Dashboard (history):", captureUrl);
      await page.goto(captureUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page
        .waitForSelector('[data-testid="history-table-row"]', { timeout: 45_000 })
        .catch(() => console.warn("No history rows yet; capturing anyway."));
      await sleep(2500);
    }

    await page.screenshot({ path: OUT, fullPage: true });
    console.log("Wrote", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
