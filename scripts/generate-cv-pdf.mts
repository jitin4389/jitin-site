/**
 * Prints /cv to public/jitin-gupta-cv.pdf and records a hash of the content it was built from.
 * Run with `npm run cv:pdf` (builds first). Commit both output files.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const PORT = 3700;
const CONTENT_FILE = "src/content/profile.ts";
const PDF_FILE = "public/jitin-gupta-cv.pdf";
const HASH_FILE = "src/content/cv-pdf.sha256";

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  stdio: "ignore",
});
try {
  await waitForServer(`http://localhost:${PORT}/cv`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.goto(`http://localhost:${PORT}/cv`, { waitUntil: "networkidle" });
  await page.pdf({
    path: PDF_FILE,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await browser.close();

  const hash = createHash("sha256")
    .update(await readFile(CONTENT_FILE))
    .digest("hex");
  await writeFile(HASH_FILE, `${hash}\n`);
  console.log(`Wrote ${PDF_FILE} and ${HASH_FILE}`);
} finally {
  server.kill();
}
