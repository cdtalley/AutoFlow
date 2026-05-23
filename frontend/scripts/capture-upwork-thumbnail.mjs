/**
 * Writes **docs/images/upwork-thumbnail.png** (1000×750) from `/portfolio/upwork` ONLY.
 * Validates page content so a Live-run / home screenshot can never ship as the catalog asset.
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync, readFileSync, copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_BASE = (process.env.PLAYWRIGHT_UI_BASE || "http://localhost:3000").replace(/\/$/, "");
const THUMB_OUT =
  process.env.PLAYWRIGHT_THUMB_OUT ||
  path.join(__dirname, "..", "..", "docs", "images", "upwork-thumbnail.png");
const THUMB_W = 1000;
const THUMB_H = 750;
const runId = process.env.PLAYWRIGHT_RUN_ID?.trim() || "";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dir = path.dirname(THUMB_OUT);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const q = runId ? `?run=${encodeURIComponent(runId)}` : "";
  const url = `${UI_BASE}/portfolio/upwork${q}`;
  console.log("Capturing:", url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: THUMB_W, height: THUMB_H } });
  try {
    await page.goto(url, { waitUntil: "load", timeout: 120_000 });
    const finalUrl = page.url();
    if (!/\/portfolio\/upwork/i.test(finalUrl)) {
      throw new Error(`Expected URL to contain /portfolio/upwork — got "${finalUrl}"`);
    }

    await page.waitForSelector('[data-testid="portfolio-upwork-thumb-ready"][data-ready="1"]', {
      timeout: 60_000,
    });

    const marker = await page.evaluate(() => {
      const t = document.body?.innerText ?? "";
      return (
        t.includes("REFERENCE STACK") &&
        t.includes("AutoFlow") &&
        t.includes("Multi-agent orchestrator")
      );
    });
    if (!marker) {
      throw new Error(
        "Page body does not contain catalog canvas copy (REFERENCE STACK / AutoFlow). Wrong route or stale build.",
      );
    }

    await sleep(800);
    await page.screenshot({ path: THUMB_OUT, fullPage: false, type: "png" });

    const buf = readFileSync(THUMB_OUT);
    if (buf.length < 15_000) {
      throw new Error(`Output PNG suspiciously small (${buf.length} bytes) — capture may be blank or wrong.`);
    }

    console.log("Wrote", THUMB_OUT, `(${buf.length} bytes)`);
    console.log("Absolute:", path.resolve(THUMB_OUT));

    const publicDir = path.join(__dirname, "..", "public");
    const publicCopy = path.join(publicDir, "upwork-catalog-thumbnail.png");
    mkdirSync(publicDir, { recursive: true });
    copyFileSync(THUMB_OUT, publicCopy);
    console.log("Also copied for easy find:", path.resolve(publicCopy));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
