# EnabledBD — Business Development Assessment

A static front-end (the original self-assessment) plus two small serverless
functions: one for **server-side PDF generation** and one for **swappable lead
capture**. Deployed to Netlify, served from a subdomain.

## What changed vs. the original single HTML file

The assessment content, branching, scoring (`computeResults`), summary, playbook,
fonts, and visual design are **unchanged** — they were extracted verbatim from
`ebd_assessment_v3.html`. Only infrastructure was wrapped around them:

- **Name/email gate** between the free summary and the playbook (capture only).
- **Server-side PDF** via headless Chromium (replaces the html2canvas pipeline
  that produced blank pages). Crisp vector text, real page breaks, page numbers,
  and an EnabledBD footer with the URL on every page.
- **Lead capture** moved off the client to a serverless function with a
  swappable destination (Google Sheet at launch → CRM later, no front-end change).

## Project layout

```
public/
  index.html            The app shell (loads the assets below)
  assets/
    styles.css          Extracted <style> — single source of truth (front-end + PDF)
    app.js              Extracted <script>: questions, scoring, summary, playbook,
                        + the new gate, lead capture, and one-click PDF download
netlify/functions/
  generate-pdf.js       Puppeteer/Chromium → PDF of the posted playbook markup
  capture-lead.js       Writes the lead to sheet | crm | both
netlify.toml            Build, functions, bundling, timeouts
package.json            puppeteer-core + @sparticuz/chromium
.env.example            Copy to .env for local dev; mirror in Netlify UI
```

## Flow

Assessment → **free summary** (no gate) → **name + email gate** → lead written →
**playbook** → **Download playbook (PDF)** (one click, server-rendered).

## How the PDF stays faithful

The browser sends the already-rendered playbook markup (`#pbdoc`) to
`generate-pdf`. The function wraps it in a clean, script-free document carrying
the same fonts and the same `styles.css`, then prints it with Chromium. So the
PDF is exactly what the user saw — the server never re-implements any content or
scoring logic.

## Local development

```bash
npm install
netlify dev            # serves public/ + functions at http://localhost:8888
```

- Create a `.env` from `.env.example` and set `SHEET_ENDPOINT` (and
  `LEAD_DESTINATION=sheet`) to test lead capture.
- **PDF locally:** the Lambda Chromium build won't run on your machine. Set
  `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Edge to test PDFs under
  `netlify dev` (see `.env.example`). In production this is unset and the bundled
  `@sparticuz/chromium` is used.

## Deploy to Netlify

1. Push this folder to a Git repo (GitHub/GitLab).
2. In Netlify: **Add new site → Import from Git**, pick the repo. Netlify reads
   `netlify.toml` (publish = `public`, functions = `netlify/functions`). No build
   command needed.
3. **Site settings → Environment variables**, add:
   - `LEAD_DESTINATION` = `sheet`
   - `SHEET_ENDPOINT` = your Apps Script `/exec` URL
   - `SITE_URL` = `assessment.enabledbd.com` (used in the PDF footer)
   - Later, to move off the Sheet: set `LEAD_DESTINATION=crm` (or `both`) and add
     `CRM_ENDPOINT` / `CRM_API_KEY`. No front-end change; adjust the CRM body
     shape in `capture-lead.js` to match your platform.
4. Deploy.

## Point the subdomain

1. Netlify: **Domain management → Add a domain** → enter
   `assessment.enabledbd.com` (or `start.enabledbd.com`).
2. At your DNS provider, add a **CNAME** record:
   - Host: `assessment` (or `start`)
   - Value: your Netlify site’s `*.netlify.app` hostname (Netlify shows the exact
     target).
3. Netlify provisions HTTPS automatically once DNS resolves.

## Where post-launch edits happen

- **Copy, questions, scoring, playbook content:** `public/assets/app.js` — the
  content lives in the same data objects as the original (`SUMMARY`, `BANK`,
  `PREFACE`, the question arrays, etc.).
- **Design/styles:** `public/assets/styles.css` (shared with the PDF, so print
  fidelity stays automatic).
- **PDF header/footer/margins:** `netlify/functions/generate-pdf.js`.
- **Lead routing/fields:** `netlify/functions/capture-lead.js` + env vars.

## Notes / possible follow-ups

- **Self-host the two fonts** (drop the files in `assets/` and update the
  `@font-face`) for fully deterministic PDFs independent of Google Fonts.
- Keep `@sparticuz/chromium` and `puppeteer-core` versions **aligned** when you
  upgrade (their Chromium/protocol versions must match).
