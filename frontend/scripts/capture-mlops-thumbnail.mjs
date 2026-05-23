/**
 * Writes **docs/images/mlops-thumbnail.png** (1000×750) from `/portfolio/mlops` ONLY.
 *
 * Usage (from frontend/):
 *   npm run dev          # separate terminal
 *   npm run screenshot:mlops
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(REPO_ROOT, "docs/images/mlops-thumbnail.png");

const UI_BASE = process.env.PLAYWRIGHT_UI_BASE ?? "http://localhost:3000";
const RUN_ID = process.env.PLAYWRIGHT_RUN_ID;

async function main() {
  const q = RUN_ID ? `?run=${encodeURIComponent(RUN_ID)}` : "";
  const url = `${UI_BASE}/portfolio/mlops${q}`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 750 } });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const finalUrl = page.url();
    if (!/\/portfolio\/mlops/i.test(finalUrl)) {
      throw new Error(`Expected URL to contain /portfolio/mlops — got "${finalUrl}"`);
    }

    await page.waitForSelector('[data-testid="portfolio-mlops-thumb-ready"][data-ready="1"]', {
      timeout: 60_000,
    });

    const tile = page.locator('[data-testid="portfolio-mlops-thumb-ready"]');
    await mkdir(path.dirname(OUT), { recursive: true });
    const png = await tile.screenshot({ type: "png" });
    await writeFile(OUT, png);
    console.log("Wrote", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
