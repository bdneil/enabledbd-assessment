# EnabledBD Assessment — Launch Checklist

Everything in "Code-side (done)" is finished and verified. The items under
"Your manual steps" only you can do (they need Netlify, HighLevel, or DNS access).

---

## 🔴 Your manual steps (do these before going public)

### 1. Verify the PDF function on a REAL Netlify deploy  ← critical path
Every PDF so far was made with local Chrome. Production uses a bundled Chromium in
the Lambda, which we have **not** exercised yet.
- Deploy to a Netlify **preview / branch deploy** (don't touch the live domain yet).
- Open the deployed site, complete the assessment, submit the gate, click
  **"Download playbook (PDF)."**
- If it downloads a real multi-page PDF → you're good.
- If it errors: check **Netlify → Functions → generate-pdf → logs**. Most likely
  cause is the Chromium bundle. Send me the log and I'll fix `netlify.toml` /
  the function. Note: `generate-pdf` needs the **26s timeout** (paid plan). Free
  plans cap at 10s and may time out on cold start.

### 2. Set production environment variables (Netlify UI)
Netlify → Site settings → Environment variables. `HL.env.txt` is local only.
```
LEAD_DESTINATION      = highlevel
HIGHLEVEL_TOKEN       = (the pit-... token from HL.env.txt)
HIGHLEVEL_LOCATION_ID = tYq0LhuHcCeINBsz6UFM
SITE_URL              = assessment.enabledbd.com
```

### 3. Point the domain + SSL
Point `assessment.enabledbd.com` at the Netlify site and confirm the certificate.

### 4. Build the HighLevel automations
The app now hands HighLevel everything it needs. You build the workflows.

**Tags the app applies automatically** (use these as workflow triggers):
`ebd-assessment`, `track-owner` / `track-builder`, `style-connector` / `-driver` /
`-educator`, `battery-high` / `-moderate` / `-low`, `community-waitlist`,
`newsletter sign up`, and `tester` (pre-launch) / `live` (after step 7).

**Merge fields available on the contact:**
`{{contact.playbook_url}}`, `{{contact.first_move}}`, `{{contact.signature_line}}`,
`{{contact.style_scores}}`, `{{contact.foundation_zone}}`, `{{contact.industry}}`, etc.

**Workflows to create:**
- **Day-0 "Here's your playbook"** email — triggered by tag `ebd-assessment`.
  Include `{{contact.playbook_url}}` (the link re-opens their exact playbook +
  regenerates the PDF) and `{{contact.first_move}}`. *This fulfils the gate's
  "we'll send your playbook" promise — without it, that promise is broken.*
- **Day-7 check-in** email — same trigger, delayed.
- **Newsletter** — trigger on tag `newsletter`; add to your newsletter audience.
- **Community waitlist** — trigger on tag `community-waitlist`.

### 5. Confirm / set the Privacy link
`public/assets/app.js` has `const PRIVACY_URL = 'https://enabledbd.com/privacy'`.
Make sure that page exists. To change it, edit the constant. To hide the gate's
Privacy link entirely, set it to `''`.

### 6. Clean up test contacts in HighLevel
Delete `ebd-test@example.com`, `ebd-proof@example.com`, and any `Proof Tester`
contacts left from testing so they don't pollute live data.

### 7. Tell me to flip the launch flag
When steps 1–3 pass and you've done your own test submissions, tell me and I'll
flip `SOURCE = 'tester'` → `'live'` (app.js). Until then, every submission is
tagged `tester` and excluded from population stats — which is what you want while
testing.

### 8. (Optional) Analytics
Add a Plausible or GA snippet to `public/index.html` if you want funnel numbers
(starts → completes → gate submits).

---

## ✅ Code-side (done & verified)

- **Outbound links wired:** "Let's talk" → `mailto:neil@enabledbd.com`; podcast →
  your YouTube channel; LinkedIn → your profile (all open in a new tab).
- **Waitlist + Newsletter are now HighLevel tag buttons** — clicking them adds the
  `community-waitlist` / `newsletter` tag to the existing contact (asks for an
  email first if someone opened a shared link without one).
- **Social + meta:** favicon (inline brand mark), Open Graph + Twitter card tags,
  and a branded 1200×630 share image at `public/assets/og-image.png`.
- **index.html:** de-dashed; footer no longer says "not a verdict."
- Removed dead `buildNext()` code (had leftover `[bracket]` placeholders).
- All proof checks (35) pass; PDFs regenerated.

> Launch flag is intentionally still `SOURCE = 'tester'` — see step 7.
