#!/usr/bin/env node
/**
 * Unified Poster Deck & Device-Framer Runtime Server
 * - Serves Posters/ on http://127.0.0.1:4173/
 * - POST /api/export-png  -> Renders every .poster-canvas on the requested page
 *                            at native 1:1 resolution via Playwright and returns PNGs
 *
 * Usage: node Posters/scripts/serve.mjs [port]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const framerPkg = path.join(rootDir, 'framer/package.json');
const layoutsJsonPath = path.join(rootDir, 'framer/layouts.json');
const port = Number(process.argv[2] || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

async function exportPagePngs(pageUrl) {
  const require = createRequire(framerPkg);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 3840, height: 3000 }, deviceScaleFactor: 1 });
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
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
    const files = [];
    for (let i = 0; i < count; i++) {
      const el = canvases.nth(i);
      const nameAttr = await el.getAttribute('data-slide-name');
      const slug = (nameAttr || `slide-${i + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const buf = await el.screenshot({ type: 'png' });
      files.push({
        filename: `${String(i + 1).padStart(2, '0')}-${slug}.png`,
        dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
      });
    }
    return files;
  } finally {
    await browser.close();
  }
}

http
  .createServer(async (req, res) => {
    const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);

    if (req.method === 'GET' && reqPath === '/api/layouts') {
      try {
        const raw = fs.existsSync(layoutsJsonPath) ? fs.readFileSync(layoutsJsonPath, 'utf8') : '[]';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(raw);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && reqPath === '/api/layouts') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const layout = JSON.parse(body || '{}');
          if (!layout.id || !Array.isArray(layout.frames)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Missing layout id or frames' }));
            return;
          }
          // Lock layout & normalize each frame's bezel boolean
          layout.locked = true;
          layout.frames = layout.frames.map((f) => ({
            deviceId: f.deviceId,
            x: Math.round(Number(f.x) || 0),
            y: Math.round(Number(f.y) || 0),
            width: Math.round(Number(f.width) || 400),
            rotation: Number(f.rotation) || 0,
            showDeviceFrame: Boolean(f.showDeviceFrame),
          }));

          const existing = fs.existsSync(layoutsJsonPath)
            ? JSON.parse(fs.readFileSync(layoutsJsonPath, 'utf8'))
            : [];
          const idx = existing.findIndex((l) => l.id === layout.id);
          if (idx >= 0) existing[idx] = layout;
          else existing.push(layout);
          fs.writeFileSync(layoutsJsonPath, JSON.stringify(existing, null, 2));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, layouts: existing }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE' && reqPath.startsWith('/api/layouts/')) {
      try {
        const targetId = decodeURIComponent(reqPath.slice('/api/layouts/'.length));
        const existing = fs.existsSync(layoutsJsonPath)
          ? JSON.parse(fs.readFileSync(layoutsJsonPath, 'utf8'))
          : [];
        const filtered = existing.filter((l) => l.id !== targetId);
        fs.writeFileSync(layoutsJsonPath, JSON.stringify(filtered, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, layouts: filtered }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'POST' && reqPath === '/api/export-png') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const { pathname } = JSON.parse(body || '{}');
          const targetUrl = `http://127.0.0.1:${port}${pathname || '/template-social-portrait.html'}`;
          const files = await exportPagePngs(targetUrl);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, files }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(rootDir, safePath === '/' ? 'template-social-portrait.html' : safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Unified Poster & Framer server running at http://127.0.0.1:${port}/`);
    console.log(`  - Layout Editor: http://127.0.0.1:${port}/layout-editor.html`);
    console.log(`  - Portrait:      http://127.0.0.1:${port}/template-social-portrait.html`);
    console.log(`  - Square:        http://127.0.0.1:${port}/template-social-square.html`);
    console.log(`  - Starter:       http://127.0.0.1:${port}/template-starter.html`);
  });
