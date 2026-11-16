#!/usr/bin/env node
/**
 * Batch PNG Exporter for Poster & Social Media Slides
 * Uses Playwright from pt-kdwiheldy/node_modules/playwright to export every
 * .poster-canvas element in an HTML file at exact native resolution (1:1).
 *
 * Usage:
 *   node Posters/scripts/export-png.mjs Posters/template-social-portrait.html [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const require = createRequire(path.join(repoRoot, 'Posters/framer/package.json'));
const { chromium } = require('playwright');

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: node Posters/scripts/export-png.mjs <path/to/slides.html> [outputDir]');
  process.exit(1);
}

const htmlPath = path.resolve(inputArg);
const baseName = path.basename(htmlPath, path.extname(htmlPath));
const outDir = path.resolve(process.argv[3] || path.join(repoRoot, 'Posters/exports', baseName));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 3840, height: 3000 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });

  // Collapse/hide toolbar & reset scale transforms so every canvas is native 1:1
  await page.evaluate(() => {
    const tb = document.querySelector('.preview-toolbar');
    if (tb) tb.style.display = 'none';
    document.querySelectorAll('.poster-canvas').forEach((c) => {
      c.style.transform = 'none';
      c.style.marginBottom = '0px';
    });
  });

  const canvases = page.locator('.poster-canvas');
  const count = await canvases.count();
  for (let i = 0; i < count; i++) {
    const el = canvases.nth(i);
    const nameAttr = await el.getAttribute('data-slide-name');
    const slug = (nameAttr || `slide-${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const outFile = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${slug}.png`);
    await el.screenshot({ path: outFile, type: 'png' });
    console.log(`Exported ${outFile}`);
  }
} finally {
  await browser.close();
}

