// One command: `node test/gen-share.js` — regenerates the five 1200x630 social
// share cards in public/static/share/. Marketing-forward: style name as the hero
// in Fraunces, a tagline pulled from the live style data, a faded brand mark for
// texture. No tactical diagram. Style only (no zone/battery/name).
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.env.PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pp = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(ROOT, 'public/static/share'); fs.mkdirSync(OUT, { recursive: true });
const CT = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml' };
const PORT = 5199;
const srv = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p === '/') p = '/index.html';
  fs.readFile(path.join(ROOT, 'public', p), (e, d) => { e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { 'Content-Type': CT[path.extname(p)] || 'application/octet-stream' }), r.end(d)); }); });

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await pp.launch({ args: ['--no-sandbox'], executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  await pg.evaluate(() => document.fonts && document.fonts.ready);
  const tags = await pg.evaluate(() => ({
    connector: EXT.connector.tag, driver: EXT.driver.tag, educator: EXT.educator.tag, powerhouse: POWER.tag,
  }));
  const cards = [
    ['connector', 'YOUR BD STYLE', "You're a", 'Connector.', tags.connector, 124],
    ['driver',    'YOUR BD STYLE', "You're a", 'Driver.',    tags.driver,    124],
    ['educator',  'YOUR BD STYLE', "You're an", 'Educator.', tags.educator,  124],
    ['powerhouse','YOUR BD STYLE', "You're a", 'Powerhouse.',tags.powerhouse,116],
    ['generic',   'THE BD ASSESSMENT', '', "What's your BD style?", "A 5-minute assessment for people who'd rather have a plan than a personality test.", 88],
  ];
  for (const [name, eyebrow, pre, word, tag, size] of cards) {
    await pg.evaluate((eyebrow, pre, word, tag, size) => {
      const spire = `<polygon points="50,12 33,86 50,70" fill="#14541c"/><polygon points="50,12 67,86 50,70" fill="#8cac8c"/><ellipse cx="50" cy="55" rx="27" ry="8.5" fill="none" stroke="#a6a6a6" stroke-width="2.6" transform="rotate(-7 50 55)"/>`;
      const mark = `<svg viewBox="0 0 100 100" width="34" height="34">${spire}</svg>`;
      const bigmark = `<svg viewBox="0 0 100 100" width="520" height="520">${spire}</svg>`;
      document.body.style.margin = '0';
      document.body.innerHTML = `<div style="width:1200px;height:630px;background:#f6f2ea;position:relative;overflow:hidden;font-family:'Hanken Grotesk',sans-serif">
        <div style="position:absolute;right:-70px;bottom:-120px;opacity:.05">${bigmark}</div>
        <div style="position:absolute;top:56px;left:90px;display:flex;align-items:center;gap:12px;font-family:'Fraunces',serif;font-weight:600;font-size:30px;color:#14541c">${mark}<span>Enabled<i style="font-style:normal;color:#346438">BD</i></span></div>
        <div style="position:absolute;left:90px;top:50%;transform:translateY(-50%);max-width:1000px">
          <div style="font-size:24px;letter-spacing:.16em;text-transform:uppercase;color:#64846c;font-weight:700;margin-bottom:16px">${eyebrow}</div>
          ${pre ? `<div style="font-family:'Fraunces',serif;font-weight:500;font-size:46px;color:#5a6a5a;line-height:1;margin-bottom:2px">${pre}</div>` : ''}
          <h1 style="font-family:'Fraunces',serif;font-weight:600;font-size:${size}px;line-height:.96;letter-spacing:-.02em;color:#14541c;margin:0;max-width:900px">${word}</h1>
          <p style="font-size:31px;color:#4a5a4a;margin-top:24px;max-width:820px;line-height:1.28">${tag}</p>
        </div>
        <div style="position:absolute;bottom:54px;left:90px;font-size:22px;color:#6f7a70;letter-spacing:.3px">assessment.enabledbd.com</div>
      </div>`;
    }, eyebrow, pre, word, tag, size);
    await pg.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('wrote', name + '.png');
  }
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
