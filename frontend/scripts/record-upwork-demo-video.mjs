/**
 * Records a ≤60s showcase of the AutoFlow operator dashboard (1920×1080).
 *
 * Prerequisites: API + worker graph reachable (same as `npm run screenshot:upwork`),
 * Next.js dev or production UI on PLAYWRIGHT_UI_BASE.
 *
 * Output: docs/videos/upwork-dashboard-demo.webm (Playwright)
 * Optional: set PLAYWRIGHT_FFMPEG=1 to also write upwork-dashboard-demo.mp4 if `ffmpeg` is on PATH.
 *
 * Env: PLAYWRIGHT_UI_BASE, PLAYWRIGHT_VIDEO_OUT (directory), PLAYWRIGHT_VIDEO_MAX_MS (default 56000)
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync, readdirSync, renameSync, copyFileSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UI_BASE = (process.env.PLAYWRIGHT_UI_BASE || "http://localhost:3000").replace(/\/$/, "");
const VIDEO_DIR = process.env.PLAYWRIGHT_VIDEO_OUT || path.join(__dirname, "..", "..", "docs", "videos");
const MAX_MS = Math.min(59_000, Number(process.env.PLAYWRIGHT_VIDEO_MAX_MS) || 56_000);
const VIEW_W = 1920;
const VIEW_H = 1080;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function elapsed(start) {
  return Date.now() - start;
}

async function smoothWheelScroll(page, totalDelta, durationMs, steps = 24) {
  const per = totalDelta / steps;
  const delay = Math.max(8, Math.floor(durationMs / steps));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per);
    await sleep(delay);
  }
}

async function easePanMainColumn(page, start) {
  const frame = page.locator('[data-testid="portfolio-main-column"]');
  const box = await frame.boundingBox();
  if (!box) return;
  const x = box.x + box.width * 0.35;
  const y0 = box.y + Math.min(box.height * 0.25, 180);
  const y1 = box.y + Math.min(box.height * 0.72, box.height - 40);
  await page.mouse.move(x, y0);
  await sleep(400);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    if (elapsed(start) > MAX_MS - 4000) return;
    const t = i / steps;
    const ease = 1 - (1 - t) ** 2;
    await page.mouse.move(x, y0 + (y1 - y0) * ease);
    await sleep(55);
  }
  await sleep(600);
}

async function main() {
  const t0 = Date.now();
  if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: VIEW_W, height: VIEW_H },
    },
  });

  const page = await context.newPage();
  const recording = page.video();

  try {
    console.log("Opening overview…", `${UI_BASE}/?tab=overview`);
    await page.goto(`${UI_BASE}/?tab=overview`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForSelector('[data-testid="portfolio-dashboard-frame"]', { timeout: 45_000 });

    await page.waitForFunction(
      () => {
        const t = document.body?.innerText ?? "";
        return t.includes("API reachable") || t.includes("API not reachable");
      },
      { timeout: 60_000 },
    );
    await sleep(1200);

    if (elapsed(t0) < MAX_MS) await smoothWheelScroll(page, 420, 2200);
    await sleep(500);
    if (elapsed(t0) < MAX_MS) await easePanMainColumn(page, t0);

    const demoBtn = page.getByTestId("overview-run-full-demo");
    await demoBtn.waitFor({ state: "visible", timeout: 15_000 });
    const disabled = await demoBtn.isDisabled();
    if (disabled) {
      throw new Error(
        'Demo button disabled — start FastAPI + deps so the UI shows "API reachable", then re-run.',
      );
    }

    console.log("Triggering Run full demo…");
    await demoBtn.click();
    await page.waitForSelector('[data-testid="live-run-panel"]', { state: "visible", timeout: 20_000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="live-run-id-input"]');
        return el instanceof HTMLInputElement && el.value.trim().length >= 8;
      },
      { timeout: 30_000 },
    );

    await page.waitForSelector('[data-testid="agent-step"]', { timeout: 120_000 });
    console.log("Agent steps visible — cinematography pass…");

    for (let i = 0; i < 3 && elapsed(t0) < MAX_MS - 18_000; i++) {
      await smoothWheelScroll(page, 280, 1600);
      await sleep(900);
      await smoothWheelScroll(page, -200, 1400);
      await sleep(700);
    }

    if (elapsed(t0) < MAX_MS - 10_000) {
      await page.getByTestId("nav-history").click();
      await page.waitForSelector('[data-testid="run-history-panel"]', { timeout: 15_000 });
      await sleep(800);
      const row = page.locator('[data-testid="history-table-row"]').first();
      if (await row.isVisible().catch(() => false)) {
        await row.hover();
        await sleep(500);
        await row.click();
        await sleep(1800);
      } else {
        await sleep(2000);
      }
    }

    if (elapsed(t0) < MAX_MS - 3500) {
      await page.getByTestId("nav-live").click();
      await sleep(1500);
      await smoothWheelScroll(page, 320, 1800);
    }

    const pad = Math.max(0, Math.min(2500, MAX_MS - elapsed(t0) - 800));
    if (pad > 0) await sleep(pad);
  } finally {
    await context.close();
    await browser.close();
  }

  let recordedPath = null;
  try {
    recordedPath = recording ? await recording.path() : null;
  } catch (e) {
    console.warn("Video path:", e.message);
  }

  const target = path.join(VIDEO_DIR, "upwork-dashboard-demo.webm");
  if (recordedPath && existsSync(recordedPath)) {
    try {
      if (recordedPath !== target) {
        if (existsSync(target)) unlinkSync(target);
        renameSync(recordedPath, target);
      }
    } catch {
      copyFileSync(recordedPath, target);
    }
    console.log("Wrote", target);
  } else {
    const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm")).sort();
    const latest = files.length ? path.join(VIDEO_DIR, files[files.length - 1]) : null;
    if (latest && existsSync(latest) && latest !== target) {
      try {
        if (existsSync(target)) unlinkSync(target);
        renameSync(latest, target);
      } catch {
        copyFileSync(latest, target);
      }
      console.log("Wrote", target);
    } else {
      console.warn("Could not resolve recorded video; check", VIDEO_DIR);
    }
  }

  if (existsSync(target) && process.env.PLAYWRIGHT_FFMPEG === "1") {
    const mp4 = path.join(VIDEO_DIR, "upwork-dashboard-demo.mp4");
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        target,
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        mp4,
      ],
      { encoding: "utf8" },
    );
    if (r.status === 0) console.log("Wrote", mp4);
    else console.warn("ffmpeg failed (install ffmpeg for MP4):", r.stderr?.slice?.(0, 400) ?? r.error);
  }

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Done in ${sec}s (cap ${MAX_MS / 1000}s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
