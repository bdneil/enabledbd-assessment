// generate-pdf.js
// Renders the already-built playbook HTML (posted from the browser) with a real
// headless Chromium and prints it to a PDF: crisp vector text, real page breaks,
// selectable/searchable content, small file size. This replaces the client-side
// html2canvas pipeline that produced blank pages.

const path = require('path');
const fs = require('fs');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// --- Shared stylesheet (single source of truth with the front-end) ----------
// styles.css is packaged with the function via `included_files` in netlify.toml.
// We try a few candidate locations so it resolves both locally (`netlify dev`)
// and on the deployed Lambda.
// Resolve a bundled asset across candidate roots (local dev + Lambda).
function resolveAsset(rel) {
  const roots = [process.cwd(), path.join(__dirname, '..', '..'), process.env.LAMBDA_TASK_ROOT || ''];
  for (const r of roots) {
    const p = path.join(r, rel);
    try { fs.accessSync(p); return p; } catch (_) { /* try next */ }
  }
  return null;
}
function readAsset(rel, encoding) {
  const p = resolveAsset(rel);
  if (!p) { console.warn('generate-pdf: asset not found:', rel); return encoding ? '' : null; }
  return fs.readFileSync(p, encoding);
}

// Fonts CSS with the woff2 files inlined as base64, so the PDF carries its own
// fonts and never depends on a network fetch at render time.
let _fontsCss = null;
function loadFontsCss() {
  if (_fontsCss !== null) return _fontsCss;
  let css = readAsset(path.join('public', 'assets', 'fonts.css'), 'utf8') || '';
  css = css.replace(/url\(['"]?\/assets\/fonts\/([^'")]+)['"]?\)/g, (m, file) => {
    const buf = readAsset(path.join('public', 'assets', 'fonts', file));
    return buf ? `url(data:font/woff2;base64,${buf.toString('base64')})` : m;
  });
  _fontsCss = css;
  return _fontsCss;
}

let _css = null;
function loadCss() {
  if (_css !== null) return _css;
  _css = readAsset(path.join('public', 'assets', 'styles.css'), 'utf8') || '';
  return _css;
}

// The public URL shown in the footer of every page.
const SITE_URL = process.env.SITE_URL || 'assessment.enabledbd.com';

// Wrap the posted playbook markup in a clean, script-free document that carries
// the same fonts + CSS the browser used, so the PDF matches what the user saw.
function buildDocument(innerHtml) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>${loadFontsCss()}</style>
<style>${loadCss()}</style>
<style>html,body{background:#fff}</style>
</head><body><div class="wrap"><div class="pb"><div class="doc" id="pbdoc">${innerHtml}</div></div></div></body></html>`;
}

const FOOTER = `
<div style="font-family:'Hanken Grotesk',Arial,sans-serif;font-size:8px;color:#6c7488;width:100%;padding:0 12mm;display:flex;justify-content:space-between;align-items:center;">
  <span>© 2026 EnabledBD. All rights reserved.</span>
  <span>${SITE_URL}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;

// Local dev fallback: point PUPPETEER_EXECUTABLE_PATH at a local Chrome/Edge to
// test PDFs without the Lambda Chromium build (e.g. under `netlify dev`).
async function launch() {
  const localExe = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (localExe) {
    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: localExe,
      headless: true,
      defaultViewport: { width: 900, height: 1200 },
    });
  }
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }
  const inner = payload && payload.html;
  if (!inner || typeof inner !== 'string') {
    return { statusCode: 400, body: 'Missing "html" in request body' };
  }
  const filename = (payload.filename && /^[\w.\-]+\.pdf$/.test(payload.filename))
    ? payload.filename
    : 'EnabledBD-Playbook.pdf';

  let browser;
  try {
    browser = await launch();
    const page = await browser.newPage();
    await page.setContent(buildDocument(inner), { waitUntil: 'networkidle0', timeout: 20000 });
    // Make sure the web fonts are actually painted before printing.
    try { await page.evaluateHandle('document.fonts && document.fonts.ready'); } catch (_) {}

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: FOOTER,
      margin: { top: '12mm', bottom: '18mm', left: '12mm', right: '12mm' },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
      body: Buffer.from(pdf).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('generate-pdf failed:', err);
    return { statusCode: 500, body: 'PDF generation failed' };
  } finally {
    if (browser) { try { await browser.close(); } catch (_) {} }
  }
};
