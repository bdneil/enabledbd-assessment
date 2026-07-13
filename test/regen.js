// One command: `node test/regen.js`
// Regenerates every persona fixture's SUMMARY + PLAYBOOK PDF from its stored
// answer set, runs the builder-leak sweep, verifies Sam Rivera is byte-for-byte
// reproducible, and prints the F-A..F-D proof table (track / energy / maturity
// band / cadence forks). Uses the SAME generate-pdf function production uses.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);                                   // so generate-pdf resolves styles/fonts
process.env.PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const genpdf = require(path.join(ROOT, 'netlify/functions/generate-pdf.js'));
const fixtures = require('./fixtures.js');

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5179;
const CT = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.woff2':'font/woff2', '.svg':'image/svg+xml' };

// A4 hard-leak terms for builder sections (outside the grow-into-later banks).
// "referral source" is reported separately — it's the intentional pillar-naming in the §1 model.
const SWEEP = /your clients|your practice|your book|your team|cross-sell/gi;
// Owner zone names must never render with the leading "The " (item 7 / zoneName()).
const THE_ZONE = /\bThe (Craftsperson|Dependable|Relationship-Builder|Intentional Advisor|Growth Partner)\b/g;

function serveStatic() {
  return http.createServer((req, res) => {
    let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
    fs.readFile(path.join(ROOT, 'public', p), (e, d) => {
      if (e) { res.writeHead(404); res.end(); }
      else { res.writeHead(200, { 'Content-Type': CT[path.extname(p)] || 'application/octet-stream' }); res.end(d); }
    });
  });
}

async function renderFixture(page, fx) {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  return await page.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans);
    user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults();
    // 1) free summary (renderResults writes #app) — freeze animated bar widths so the PDF isn't empty
    renderResults(lastR);
    document.querySelectorAll('.appFill').forEach(e => e.style.width = lastR.appetite + '%');
    document.querySelectorAll('.capFill').forEach(e => e.style.width = lastR.capacity + '%');
    const bf = document.getElementById('batFill'); if (bf) bf.style.width = lastR.battery + '%';
    document.querySelectorAll('.ext .track > i').forEach(e => e.style.width = e.getAttribute('data-w') + '%');
    document.querySelectorAll('.rvUp').forEach(e => e.classList.add('rvIn'));   // reveal staged blocks so the summary PDF isn't blank
    const summary = app.innerHTML;
    // 2) full playbook (renderPlaybook overwrites #app, exposes #pbdoc)
    renderPlaybook(lastR);
    const pbdoc = document.getElementById('pbdoc').innerHTML;
    const vals = [lastR.ext.connector, lastR.ext.driver, lastR.ext.educator];
    const mx = Math.max(...vals) || 1;
    return {
      pbdoc, summary,
      meta: { track: lastR.track, primary: lastR.primary, zone: lastR.zone.name, maturity: lastR.maturity,
              appetite: lastR.appetite, battery: lastR.battery, cadence: lastR.cadence, integrated: lastR.integrated,
              foundationLed: lastR.foundationLed, discrepancy: lastR.discrepancy || null, solo: lastR.solo,
              ext: { c: lastR.ext.connector, d: lastR.ext.driver, e: lastR.ext.educator },
              strong: vals.filter(v => v >= 0.6 * mx).length,
              outward: (answers.F8 === 1 ? 1 : 0),
              assignedType: styleHeadline(lastR) },
    };
  }, fx.answers, fx.user);
}

async function toPDF(html, filename) {
  const res = await genpdf.handler({ httpMethod: 'POST', body: JSON.stringify({ html, filename }) });
  if (res.statusCode !== 200) throw new Error('PDF ' + res.statusCode + ' for ' + filename);
  try {
    fs.writeFileSync(path.join(OUT, filename), Buffer.from(res.body, 'base64'));
  } catch (e) {
    // A viewer holding the file open (EBUSY) shouldn't abort the proof — the checks run on HTML.
    if (e.code === 'EBUSY' || e.code === 'EPERM') console.warn('  (skip write, file locked:', filename + ')');
    else throw e;
  }
}

// keep only builder sections outside the real Activity/Conversation banks for the sweep
function sweepText(pbdoc) {
  const ab = pbdoc.indexOf('"pbh">Activity bank');
  const cb = pbdoc.indexOf('"pbh">Conversation bank');
  const kept = (ab > -1 && cb > -1) ? (pbdoc.slice(0, ab) + pbdoc.slice(cb)) : pbdoc;
  return kept.replace(/<[^>]+>/g, ' ');
}

// --- proof signal extractors (read the actual rendered fork that landed) ---
function energyOf(pb)   { return /Time with people/.test(pb) ? 'in-room' : (/Quiet, focused time/.test(pb) ? 'solo' : '?'); }
function p5closeOf(pb)  { return /keep these as prompts/.test(pb) ? 'burst' : (/run this as a checklist/.test(pb) ? 'rhythm' : '?'); }
function stick1Of(pb)   { return /Put it on the calendar, your way/.test(pb) ? 'burst' : (/Put it on the calendar/.test(pb) ? 'rhythm' : '?'); }
function leadInOf(pb)   { return /leans harder into/.test(pb) ? 'top' : (/not yet deliberate/.test(pb) ? 'bottom' : (/leans into/.test(pb) ? 'middle' : '?')); }
function stretchOf(pb)  { return /There's no rung above/.test(pb) ? 'multiplication' : (/One rung up/.test(pb) ? 'here-next' : '?'); }
function coverOf(pb)    { const m = pb.match(/class="pbcover"[\s\S]*?<h1[^>]*>(You're an? [A-Za-z]+\.)/); return m ? m[1] : '?'; }

(async () => {
  const server = serveStatic(); await new Promise(r => server.listen(PORT, r));
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  const page = await browser.newPage();
  const report = [];
  const htmlByName = {};
  const sig = {};        // fixture -> extracted proof signals
  const metaByName = {}; // fixture -> computed meta (raw scores, threshold inputs)

  for (const fx of fixtures) {
    const { pbdoc, summary, meta } = await renderFixture(page, fx);
    htmlByName[fx.name] = pbdoc;
    metaByName[fx.name] = meta;
    await toPDF(summary, fx.name + '-summary.pdf');
    await toPDF(pbdoc, fx.name + '.pdf');

    sig[fx.name] = {
      track: meta.track, energy: energyOf(pbdoc), p5close: p5closeOf(pbdoc), stick1: stick1Of(pbdoc),
      leadIn: leadInOf(pbdoc), stretch: stretchOf(pbdoc), cover: coverOf(pbdoc),
      theZone: ((summary + pbdoc).match(THE_ZONE) || []),
      maturity: meta.maturity, zone: meta.zone,
    };

    const line = { fixture: fx.name, track: meta.track, style: meta.primary, zone: meta.zone, mat: meta.maturity, cadence: meta.cadence, discrepancy: meta.discrepancy };
    line.personalityTotal = (pbdoc.match(/personality/gi) || []).length;   // must be exactly 2, both in Part 1
    line.burstP5 = /keep these as prompts/.test(pbdoc);                     // Part 5 opportunistic format
    line.burstP6 = /Put it on the calendar, your way/.test(pbdoc);         // Part 6 make-it-stick #1 burst
    if (fx.answers.GATE !== 0) {  // builder-track fixtures get the leak sweep
      const swept = sweepText(pbdoc);
      line.hardLeaks = (swept.match(SWEEP) || []);
      line.referralSourceCount = (swept.match(/referral source/gi) || []).length;
    }
    report.push(line);
  }

  // reproducibility: Sam (builder-educator) twice → identical HTML
  const a = (await renderFixture(page, fixtures.find(f => f.name === 'builder-educator'))).pbdoc;
  const b = (await renderFixture(page, fixtures.find(f => f.name === 'builder-educator'))).pbdoc;
  const reproducible = a === b && a === htmlByName['builder-educator'];

  // reproducibility: builder-powerhouse twice → identical HTML (Powerhouse path)
  const pa = (await renderFixture(page, fixtures.find(f => f.name === 'builder-powerhouse'))).pbdoc;
  const pb2 = (await renderFixture(page, fixtures.find(f => f.name === 'builder-powerhouse'))).pbdoc;
  const powerReproducible = pa === pb2 && pa === htmlByName['builder-powerhouse'];

  // ---- cover-graphic colors: call pyramidSVG for each of the 4 style covers ----
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  const svgs = await page.evaluate(() => ({
    connector: pyramidSVG('connector'), driver: pyramidSVG('driver'),
    educator: pyramidSVG('educator'), power: pyramidSVG('power'),
  }));
  const fillAt = (svg, x) => { const m = svg.match(new RegExp('<rect x="' + x + '"[^>]*fill="([^"]+)"')); return m ? m[1].toLowerCase() : '?'; };
  const ringOf = (svg) => { const m = svg.match(/<ellipse[^>]*stroke="([^"]+)"[^>]*stroke-width="([^"]+)"/); return m ? { c: m[1].toLowerCase(), w: m[2] } : {}; };
  const cov = {};
  for (const k of ['connector', 'driver', 'educator', 'power']) {
    cov[k] = { referral: fillAt(svgs[k], 77), prospect: fillAt(svgs[k], 163), clients: fillAt(svgs[k], 58),
               brand: fillAt(svgs[k], 116), ring: ringOf(svgs[k]), hasGray: /#a6a6a6/i.test(svgs[k]) };
  }

  // ---- LIVE gate → sheet: drive the real gate, intercept the capture-lead POST ----
  const gatePage = await browser.newPage();
  await gatePage.setRequestInterception(true);
  let gateBody = null; let resolveGate;
  const gotGate = new Promise(r => { resolveGate = r; });
  gatePage.on('request', req => {
    if (req.url().includes('capture-lead')) { gateBody = req.postData(); resolveGate();
      req.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); }
    else req.continue();
  });
  await gatePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  const gfx = fixtures.find(f => f.name === 'builder-powerhouse');
  await gatePage.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans);
    user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults(); renderResults(lastR);
    showGate();
    document.getElementById('gName').value = 'Proof Tester';
    document.getElementById('gEmail').value = 'ebd-proof@example.com';
    submitGate();   // → captureLead() → POST /.netlify/functions/capture-lead (intercepted)
  }, gfx.answers, gfx.user);
  await gotGate;
  const gateLead = JSON.parse(gateBody);

  // ---- capture artifacts for the new-item checks (reveal / compare / share / gate / disclaimer / edge) ----
  const OUTART = path.join(OUT, 'artifacts'); fs.mkdirSync(OUTART, { recursive: true });
  const capPage = await browser.newPage();
  await capPage.setViewport({ width: 760, height: 1000, deviceScaleFactor: 2 });
  await capPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  const ocFx = fixtures.find(f => f.name === 'owner-connector');
  // (1) reveal sequence — non-reduced: hero first, then the rest flows in
  await capPage.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans); user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults(); finish();
  }, ocFx.answers, ocFx.user);
  await new Promise(r => setTimeout(r, 250));  await capPage.screenshot({ path: path.join(OUTART, 'reveal-1-reading-or-hero.png') });
  await new Promise(r => setTimeout(r, 1500)); await capPage.screenshot({ path: path.join(OUTART, 'reveal-2-hero.png') });
  await new Promise(r => setTimeout(r, 1800)); await capPage.screenshot({ path: path.join(OUTART, 'reveal-3-rest.png') });
  // (2) summary artifacts + share payload + gate + encoded r
  const cap = await capPage.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans); user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults(); renderResults(lastR);
    document.querySelectorAll('.rvUp').forEach(e => e.classList.add('rvIn'));
    const summary = app.innerHTML;
    const encoded = encodeResult(lastR);
    const shareCalls = [];
    window.open = (u) => { shareCalls.push(u); return null; };
    window.prompt = (m, v) => { shareCalls.push('PROMPT:' + v); return null; };
    try { if (navigator.clipboard) navigator.clipboard.writeText = (t) => { shareCalls.push('COPY:' + t); return Promise.resolve(); }; } catch (_) {}
    const sb = document.getElementById('shareBtn'); if (sb) sb.click();          // open the menu
    Array.prototype.forEach.call(document.querySelectorAll('.shareOpt'), el => el.click());  // LinkedIn, X, Copy
    showGate();
    return { summary, gate: app.innerHTML, shareCalls, encoded, primary: lastR.primary };
  }, ocFx.answers, ocFx.user);
  // gate screenshot (privacy line)
  await capPage.screenshot({ path: path.join(OUTART, 'gate-privacy.png') });
  // summary disclaimer screenshot (render summary, scroll to bottom)
  await capPage.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans); user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults(); renderResults(lastR);
    document.querySelectorAll('.rvUp').forEach(e => e.classList.add('rvIn'));
    const d = document.querySelector('.resDisclaimer'); if (d) d.scrollIntoView();
  }, ocFx.answers, ocFx.user);
  await new Promise(r => setTimeout(r, 150)); await capPage.screenshot({ path: path.join(OUTART, 'summary-disclaimer.png') });
  // (3) reduced-motion: everything visible, in order, no hero viewport-hog
  await capPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const rm = await capPage.evaluate((ans, u) => {
    for (const k in answers) delete answers[k];
    Object.assign(answers, ans); user.name = u.name || ''; user.email = ''; user.industry = u.industry || '';
    lastR = computeResults(); finish();          // reduced-motion path skips the reading beat
    const ups = [].slice.call(document.querySelectorAll('.revealRest .rvUp'));
    const hidden = ups.filter(e => getComputedStyle(e).opacity !== '1').length;
    const heroMin = getComputedStyle(document.querySelector('.revealHero')).minHeight;
    return { total: ups.length, hidden, heroMin, isReading: !!document.querySelector('.reading') };
  }, ocFx.answers, ocFx.user);
  await new Promise(r => setTimeout(r, 150)); await capPage.screenshot({ path: path.join(OUTART, 'reduced-motion.png') });

  await browser.close(); server.close();

  // ---- edge OG logic (item 6): decode a real ?r= to style, inject per-style tags ----
  const oglib = await import('../netlify/edge-functions/lib/og-lib.mjs');
  const HOST = 'https://preview.example.netlify.app';
  const indexHtml = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  const ogStyleFromR = oglib.styleFromR(cap.encoded);
  const ogFromS = oglib.normalizeStyle('powerhouse');
  const ogFullUrl = HOST + '/?r=' + cap.encoded;
  const ogHtml = oglib.rewriteHtml(indexHtml, HOST, ogStyleFromR, ogFullUrl);
  const genpdfSrc = fs.readFileSync(path.join(ROOT, 'netlify/functions/generate-pdf.js'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'public/assets/app.js'), 'utf8');

  // Feed the intercepted gate payload through capture-lead with a MOCK sheet endpoint,
  // proving the raw style scores land in a sheet row (destination-agnostic).
  let sheetRow = null;
  const mockSheet = http.createServer((req, res) => {
    let body = ''; req.on('data', c => body += c); req.on('end', () => { sheetRow = body; res.writeHead(200); res.end('OK'); });
  });
  await new Promise(r => mockSheet.listen(5180, r));
  process.env.LEAD_DESTINATION = 'sheet';
  process.env.SHEET_ENDPOINT = 'http://localhost:5180/';
  delete require.cache[require.resolve('../netlify/functions/capture-lead.js')];
  const capture = require('../netlify/functions/capture-lead.js');
  const capRes = await capture.handler({ httpMethod: 'POST', body: gateBody });
  await new Promise(r => mockSheet.close(r));
  const sheetParams = new URLSearchParams(sheetRow || '');
  const sheetStyleScores = sheetParams.get('style_scores');

  console.log('\n=== fixture report ===');
  report.forEach(r => console.log(JSON.stringify(r)));
  const hardLeaks = report.filter(r => r.hardLeaks && r.hardLeaks.length).map(r => r.fixture + ': ' + r.hardLeaks.join(', '));
  const badPers = report.filter(r => r.personalityTotal !== 2).map(r => r.fixture + ': ' + r.personalityTotal);
  console.log('\nbuilder hard leaks (your clients/practice/book/team/cross-sell):', hardLeaks.length ? hardLeaks : 'NONE ✓');
  console.log('fixtures where "personality" != 2:', badPers.length ? badPers : 'NONE ✓ (exactly 2, both Part 1)');
  const burstBad = report.filter(r => r.burstP5 !== r.burstP6).map(r => r.fixture + ' (P5=' + r.burstP5 + ', P6=' + r.burstP6 + ')');
  console.log('burst variant P5+P6 together (never one of each):', burstBad.length ? ('MISMATCH ✗ ' + burstBad) : 'CONSISTENT ✓');
  console.log('Sam reproducible (identical HTML x2):', reproducible ? 'YES ✓' : 'NO ✗');
  console.log('builder-powerhouse reproducible (identical HTML x2):', powerReproducible ? 'YES ✓' : 'NO ✗');

  const pad = (s, n) => String(s).padEnd(n);
  const checks = [];

  // ================= ITEM 1: POWERHOUSE THRESHOLD TRACE =================
  console.log('\n=== ITEM 1: Powerhouse threshold trace ===');
  console.log('Threshold rule (app.js): integrated = maturity>=60 && strong>=2 && appetite>=58 && outward===1');
  console.log('  strong = count of style scores >= 0.6 * max');
  ['owner-powerhouse', 'builder-powerhouse'].forEach(n => {
    const m = metaByName[n];
    console.log(`  ${pad(n, 18)} C:${m.ext.c.toFixed(2)} D:${m.ext.d.toFixed(2)} E:${m.ext.e.toFixed(2)}  ` +
      `strong=${m.strong}  mat=${m.maturity}(>=60:${m.maturity >= 60})  app=${m.appetite}(>=58:${m.appetite >= 58})  ` +
      `outward=${m.outward}  => integrated=${m.integrated}  type="${m.assignedType}"`);
  });
  const evenBlend = ['owner-powerhouse', 'builder-powerhouse'].every(n => metaByName[n].strong === 3);
  checks.push(['Powerhouse fixture is an even 3-way blend (strong===3) on both tracks', evenBlend]);
  checks.push(['owner-powerhouse classifies Powerhouse',   metaByName['owner-powerhouse'].integrated && metaByName['owner-powerhouse'].assignedType === 'Powerhouse']);
  checks.push(['builder-powerhouse classifies Powerhouse (track-neutral fix)', metaByName['builder-powerhouse'].integrated && metaByName['builder-powerhouse'].assignedType === 'Powerhouse']);

  // ================= RAW-SCORE TABLE: fixture × (C, D, E, type) =================
  const EXPECT = {
    'owner-connector': 'Connector', 'owner-driver': 'Driver', 'owner-educator': 'Educator', 'owner-powerhouse': 'Powerhouse',
    'builder-connector': 'Connector', 'builder-driver': 'Driver', 'builder-educator': 'Educator', 'builder-powerhouse': 'Powerhouse',
    'introverted-connector': 'Connector', 'aspirational-connector': 'Connector', 'burst-owner': 'Driver', 'burst-builder': 'Educator',
    'F-A': 'Connector', 'F-B': 'Driver', 'F-C': 'Educator', 'F-D': 'Connector',
  };
  console.log('\n=== RAW-SCORE TABLE (raw style scores → assigned type) ===');
  console.log(pad('fixture', 24) + pad('C', 7) + pad('D', 7) + pad('E', 7) + pad('assigned', 12) + pad('expected', 12) + 'match');
  let typeMismatch = [];
  fixtures.forEach(fx => {
    const m = metaByName[fx.name], exp = EXPECT[fx.name], ok = m.assignedType === exp;
    if (!ok) typeMismatch.push(fx.name + ' (got ' + m.assignedType + ', want ' + exp + ')');
    console.log(pad(fx.name, 24) + pad(m.ext.c.toFixed(2), 7) + pad(m.ext.d.toFixed(2), 7) + pad(m.ext.e.toFixed(2), 7) +
      pad(m.assignedType, 12) + pad(exp, 12) + (ok ? 'PASS ✓' : 'FAIL ✗'));
  });
  checks.push(['every fixture assigned type matches its name', typeMismatch.length === 0]);

  // ================= ITEMS 4 & 5: COVER-GRAPHIC COLORS (side-by-side) =================
  console.log('\n=== ITEMS 4 & 5: cover graphic colors (Referral / Prospect / Ring / Brand / Clients) ===');
  console.log(pad('cover', 12) + pad('referral', 11) + pad('prospect', 11) + pad('ring', 16) + pad('brand', 11) + pad('clients', 11) + 'gray?');
  ['connector', 'driver', 'educator', 'power'].forEach(k => {
    const c = cov[k];
    console.log(pad(k, 12) + pad(c.referral, 11) + pad(c.prospect, 11) + pad(c.ring.c + '/' + c.ring.w, 16) + pad(c.brand, 11) + pad(c.clients, 11) + (c.hasGray ? 'YES' : 'no'));
  });
  const GREEN = '#346438', POWER_MID = '#4f7d56', DARK = '#14541c', MUTE = '#e9ebe3', MUTERING = '#d3d6cc';
  checks.push(['Educator ring is GREEN, lit weight (not gray)', cov.educator.ring.c === GREEN && cov.educator.ring.w === '5']);
  checks.push(['Educator Brand chip is GREEN', cov.educator.brand === GREEN]);
  checks.push(['Educator pillars stay muted', cov.educator.referral === MUTE && cov.educator.prospect === MUTE]);
  checks.push(['Educator cover has NO gray (#a6a6a6)', !cov.educator.hasGray]);
  checks.push(['Powerhouse: Referral === Prospect === Ring (one mid-green, none fuller)',
    cov.power.referral === POWER_MID && cov.power.prospect === POWER_MID && cov.power.ring.c === POWER_MID]);
  checks.push(['Powerhouse: Clients slab stays dark green', cov.power.clients === DARK]);
  checks.push(['Powerhouse cover has NO gray', !cov.power.hasGray]);
  checks.push(['Connector lights only Referral; ring muted', cov.connector.referral === GREEN && cov.connector.prospect === MUTE && cov.connector.ring.c === MUTERING]);
  checks.push(['Driver lights only Prospect; ring muted', cov.driver.prospect === '#64846c' && cov.driver.referral === MUTE && cov.driver.ring.c === MUTERING]);

  // ================= ITEM 2: BUILDER POWERHOUSE COPY =================
  const bpDoc = htmlByName['builder-powerhouse'];
  const bpCover = coverOf(bpDoc);
  console.log('\n=== ITEM 2: builder-powerhouse cover + copy ===');
  console.log('  cover h1:', bpCover);
  checks.push(['builder-powerhouse cover reads "You\'re a Powerhouse."', bpCover === "You're a Powerhouse."]);
  checks.push(['builder-powerhouse Part 2 uses builder copy ("rarer this early")', /rarer this early/.test(bpDoc)]);
  checks.push(['builder-powerhouse Part 2 names the sharper trap ("no client base to anchor it")', /no client base to anchor it/.test(bpDoc)]);
  checks.push(['builder-powerhouse does NOT use owner "deepening clients" power line', !/deepening clients, working a network, chasing opportunities, and building your personal brand/.test(bpDoc)]);
  // downstream conditionals must all render for the builder Powerhouse
  checks.push(['builder-powerhouse ENERGY block renders', /Time with people|Quiet, focused time/.test(bpDoc)]);
  checks.push(['builder-powerhouse cadence/Part5 format renders', /keep these as prompts|run this as a checklist/.test(bpDoc)]);
  checks.push(['builder-powerhouse Part5 lead-in renders', /leans harder into|leans into|not yet deliberate|point your effort at one pillar/.test(bpDoc)]);
  checks.push(['builder-powerhouse stretch renders', /There's no rung above|One rung up/.test(bpDoc)]);

  // ================= ITEM 7: SIGNATURE LINE (both tracks carry "foundation") =================
  console.log('\n=== ITEM 7: signature line sweep (cover + summary, both tracks) ===');
  const sigRe = /([A-Za-z]+) · ([^·]+?) foundation · (High|Moderate|Low) battery/;
  const sigCoverOK = [];
  ['owner-connector', 'builder-connector', 'builder-powerhouse'].forEach(n => {
    const doc = htmlByName[n];
    const m = doc.match(sigRe);
    console.log('  ' + pad(n, 20) + (m ? m[0] : 'NO MATCH'));
    sigCoverOK.push(!!m);
  });
  checks.push(['signature line carries "foundation" on both tracks (owner + builder + powerhouse)', sigCoverOK.every(Boolean)]);

  // ================= ITEM 3: RAW SCORES → SHEET (live gate) =================
  console.log('\n=== ITEM 3: live gate → sheet ===');
  console.log('  gate POST payload style_scores:', gateLead.style_scores);
  console.log('  gate POST payload signature_line:', gateLead.signature_line);
  console.log('  capture-lead handler ->', capRes.statusCode, capRes.body);
  console.log('  sheet row style_scores column:', sheetStyleScores);
  checks.push(['gate payload includes style_scores (C:_|D:_|E:_)', /^C:\d+\|D:\d+\|E:\d+$/.test(gateLead.style_scores || '')]);
  checks.push(['gate payload includes signature_line', /foundation · (High|Moderate|Low) battery/.test(gateLead.signature_line || '')]);
  checks.push(['raw style scores LAND in sheet row (style_scores column present)', /^C:\d+\|D:\d+\|E:\d+$/.test(sheetStyleScores || '')]);

  // ================= PROOF (F-A..F-D) =================
  const P = ['F-A', 'F-B', 'F-C', 'F-D'];
  const rows = [
    ['track',        f => sig[f].track],
    ['energy',       f => sig[f].energy],
    ['P5 close',     f => sig[f].p5close],
    ['make-stick#1', f => sig[f].stick1],
    ['P5 lead-in',   f => sig[f].leadIn],
    ['stretch',      f => sig[f].stretch],
    ['cover h1',     f => sig[f].cover],
    ['zone',         f => sig[f].zone + ' (' + sig[f].maturity + ')'],
    ['"The"+zone',   f => sig[f].theZone.length ? 'LEAK:' + sig[f].theZone.join(',') : 'none'],
  ];
  console.log('\n=== PROOF: F-A..F-D conditional forks ===');
  console.log(pad('signal', 14) + P.map(p => pad(p, 22)).join(''));
  rows.forEach(([label, fn]) => console.log(pad(label, 14) + P.map(p => pad(fn(p), 22)).join('')));

  // assertions (F-A..F-D forks — appended to the shared checks list)
  const differ = k => sig['F-A'][k] !== sig['F-B'][k];
  checks.push(['F-A vs F-B differ: energy',       differ('energy')]);
  checks.push(['F-A vs F-B differ: P5 close',     differ('p5close')]);
  checks.push(['F-A vs F-B differ: make-stick#1', differ('stick1')]);
  checks.push(['F-A vs F-B differ: P5 lead-in',   differ('leadIn')]);
  checks.push(['F-A vs F-B differ: stretch',      differ('stretch')]);
  checks.push(['F-B & F-D cadence agree (P5 close = P6 stick, both burst)',
    sig['F-B'].p5close === 'burst' && sig['F-B'].stick1 === 'burst' &&
    sig['F-D'].p5close === 'burst' && sig['F-D'].stick1 === 'burst']);
  checks.push(['each fixture: P5 close === make-stick#1', P.every(p => sig[p].p5close === sig[p].stick1)]);
  checks.push(["F-A cover === \"You're a Connector.\" (article + space)", sig['F-A'].cover === "You're a Connector."]);
  checks.push(['no "The"+zone leak in any of F-A..F-D', P.every(p => sig[p].theZone.length === 0)]);
  checks.push(['no unresolved (?) signal in F-A..F-D',
    P.every(p => !['energy','p5close','stick1','leadIn','stretch','cover'].some(k => String(sig[p][k]).includes('?')))]);

  // ================= THIS SESSION: legal/trust · reveal · compare · share · OG =================
  const launchStart = checks.length;
  const DISC = 'not a validated psychometric instrument';
  const sumHtml = cap.summary;
  checks.push(['item2 · disclaimer on summary (web)', sumHtml.includes(DISC)]);
  checks.push(['item2 · disclaimer in playbook What\'s Next (PDF)', htmlByName['owner-connector'].includes(DISC)]);
  checks.push(['item3 · gate privacy line (exact)', cap.gate.includes("plus a short series of emails to help you run it") && cap.gate.includes("We don't sell or share your information")]);
  checks.push(['item3 · gate Privacy Policy link → privacy-policy/', cap.gate.includes('privacy-policy/') && cap.gate.includes('>Privacy Policy</a>')]);
  checks.push(['item4 · copyright in SITE footer', indexHtml.includes('© 2026 EnabledBD. All rights reserved.')]);
  checks.push(['item4 · copyright in PDF footer', genpdfSrc.includes('© 2026 EnabledBD. All rights reserved.')]);
  checks.push(['analytics · GA4 tag in index.html', indexHtml.includes('G-73GN50DX5B') && indexHtml.includes('gtag/js')]);
  checks.push(['analytics · funnel events wired (start/complete/gate/share)', ["track('assessment_start'","track('assessment_complete'","track('gate_submit'","track('share'"].every(e => appSrc.includes(e))]);
  // ---- privacy / consent hardening ----
  let decodedPayload = {};
  try { decodedPayload = JSON.parse(Buffer.from(cap.encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); } catch (_) {}
  checks.push(['privacy · ?r= payload has NO name (nm removed)', !('nm' in decodedPayload) && !JSON.stringify(decodedPayload).includes(ocFx.user.name)]);
  checks.push(['privacy · GA consent default DENIED + no auto-config', indexHtml.includes("consent','default'") && indexHtml.includes("analytics_storage:'denied'") && !indexHtml.includes("gtag('config'")]);
  checks.push(['privacy · GA clean paths (/result,/playbook) + send_page_view:false', appSrc.includes("gaSet('/result'") && appSrc.includes("gaSet('/playbook'") && appSrc.includes('send_page_view:false')]);
  checks.push(['privacy · every hit pins clean page_location (not window.location)', appSrc.includes('page_location:loc,page_path:gaPath')]);
  checks.push(['consent · banner text + one-click Accept/Decline', appSrc.includes('We use one analytics cookie to understand how people use this assessment. No ads, no selling data.') && appSrc.includes('consentAccept()') && appSrc.includes('consentDecline()')]);
  checks.push(['consent · choice persisted ~12mo (localStorage + TTL)', appSrc.includes('CONSENT_TTL') && appSrc.includes('localStorage')]);
  checks.push(['item4 · Terms & Conditions link in footer', indexHtml.includes('terms-and-conditions/') && indexHtml.includes('Terms &amp; Conditions')]);
  checks.push(['item4 · Privacy Policy link in footer (static, every state)', indexHtml.includes('privacy-policy/') && indexHtml.includes('>Privacy Policy</a>')]);
  const shareImgs = ['connector','driver','educator','powerhouse','generic'];
  const missingImgs = shareImgs.filter(s => !fs.existsSync(path.join(ROOT,'public/static/share',s+'.png')));
  checks.push(['item5 · five share images exist', missingImgs.length===0]);
  checks.push(['item6 · landing og:title = "What\'s your BD style?"', indexHtml.includes('og:title" content="What\'s your BD style?"')]);
  checks.push(['item6 · landing og:image = generic.png', indexHtml.includes('/static/share/generic.png')]);
  checks.push(['item6 · edge decodes ?r= → style (connector)', ogStyleFromR === 'connector']);
  checks.push(['item6 · edge normalizes ?s= (powerhouse)', ogFromS === 'powerhouse']);
  checks.push(['item6 · edge injects per-style og:image', ogHtml.includes(HOST+'/static/share/connector.png')]);
  checks.push(['item6 · edge injects per-style og:title', ogHtml.includes('content="You\'re a Connector."')]);
  checks.push(['item6 · edge rewrites host (no hardcoded domain left)', !ogHtml.includes('https://assessment.enabledbd.com')]);
  checks.push(['item6 · edge sets og:url to the shared URL (canonical match)', ogHtml.includes('property="og:url" content="' + ogFullUrl + '"')]);
  checks.push(['item6 · OG never leaks zone/battery/name', !/og:[a-z]+"\s+content="[^"]*(Growth Partner|Emerging Developer|Rising Rainmaker|battery|Ava|Ben|Cara|Dev)/i.test(ogHtml)]);
  const sc = cap.shareCalls || [];
  const li = sc.find(u => /linkedin\.com\/sharing/.test(u)) || '';
  const cp = sc.find(u => /^(COPY|PROMPT):/.test(u)) || '';
  checks.push(['item7 · share button + LinkedIn·Copy options (X removed)', sumHtml.includes('id="shareBtn"') && sumHtml.includes("shareTo('linkedin')") && sumHtml.includes("shareTo('copy')") && !sumHtml.includes("shareTo('x')")]);
  checks.push(['item7 · LinkedIn shares ?s= landing, no ?r=', /s%3Dconnector/.test(li) && !/r%3D/.test(li)]);
  checks.push(['item7 · Copy = clean ?s= link, no ?r=', cp.includes('?s=connector') && !cp.includes('?r=')]);
  checks.push(['compare · three-styles strip present', sumHtml.includes('stylesCompare') && sumHtml.includes('The three styles')]);
  checks.push(['compare · reader\'s style marked (you)', sumHtml.includes('sc-you')]);
  checks.push(['item8 · reveal hero + rest structure', sumHtml.includes('revealHero') && sumHtml.includes('revealRest')]);
  checks.push(['item8 · reduced-motion: all rest blocks visible', rm.hidden===0 && rm.total>0]);
  checks.push(['item8 · reduced-motion: no viewport-hog, no reading beat', rm.heroMin==='0px' && rm.isReading===false]);

  console.log('\n=== THIS SESSION — item × check ===');
  checks.slice(launchStart).forEach(([name, ok]) => console.log('  ' + (ok ? 'PASS ✓  ' : 'FAIL ✗  ') + name));
  console.log('\n  OG decode: ?r=(owner-connector) →', ogStyleFromR, '| ?s=powerhouse →', ogFromS);
  console.log('  share targets:', JSON.stringify(cap.shareCalls));
  console.log('  reduced-motion: rest blocks', rm.total, '| hidden', rm.hidden, '| hero min-height', rm.heroMin);
  console.log('  artifacts written to', OUTART);

  console.log('\n=== PROOF assertions ===');
  checks.forEach(([name, ok]) => console.log((ok ? 'PASS ✓  ' : 'FAIL ✗  ') + name));
  const fails = checks.filter(c => !c[1]).map(c => c[0]);

  console.log('\nPDFs written to', OUT, '(' + (fixtures.length * 2) + ': each fixture -summary + playbook)');
  if (fails.length) { console.error('\n*** PROOF FAILED:', fails.length, 'check(s) ***'); process.exit(1); }
  console.log('\n*** PROOF PASSED: all ' + checks.length + ' checks ✓ ***');
})().catch(e => { console.error(e); process.exit(1); });
