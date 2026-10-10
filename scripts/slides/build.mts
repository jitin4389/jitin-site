/**
 * Build an article's slide deck: SVG masters into public/writing/<slug>/, and with --png,
 * 1600x900 PNG exports into exports/slides/<slug>/ (git-ignored) for LinkedIn, Medium and video.
 *
 *   node scripts/slides/build.mts learning-loop-for-ai-agents [--png]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { frame } from "./lib.mts";

const slug = process.argv[2];
const png = process.argv.includes("--png");
if (!slug) {
  console.error("usage: node scripts/slides/build.mts <deck-slug> [--png]");
  process.exit(1);
}

const { deck, slides } = await import(`./decks/${slug}.mts`);
const outDir = path.join("public", "writing", deck.slug);
await mkdir(outDir, { recursive: true });

const files: string[] = [];
for (const [i, s] of slides.entries()) {
  const svg = frame({
    title: s.title,
    sub: s.sub,
    n: i + 1,
    total: slides.length,
    deck: deck.name,
    author: deck.author,
    body: s.body(),
    legend: s.legend,
    describe: s.describe,
  });
  const file = path.join(outDir, `${s.file}.svg`);
  await writeFile(file, svg + "\n");
  files.push(file);
}
console.log(`${files.length} slides → ${outDir}`);

if (png) {
  const { chromium } = await import("playwright");
  const pngDir = path.join("exports", "slides", deck.slug);
  await mkdir(pngDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  for (const file of files) {
    await page.goto("file://" + path.resolve(file));
    await page.screenshot({
      path: path.join(pngDir, path.basename(file, ".svg") + ".png"),
    });
  }
  await browser.close();
  console.log(`PNG exports → ${pngDir}`);
}
