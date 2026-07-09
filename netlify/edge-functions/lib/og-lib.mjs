// Pure, portable helpers for the OG edge function. No Deno/Node-specific APIs
// beyond atob + TextDecoder (both are globals in Deno and Node 18+), so this
// module is unit-testable from the Node proof harness AND runs at the edge.

const STYLES = ['connector', 'driver', 'educator', 'powerhouse'];
const NAMES = { connector: 'Connector', driver: 'Driver', educator: 'Educator', powerhouse: 'Powerhouse' };

export function normalizeStyle(s) {
  return STYLES.indexOf(s) >= 0 ? s : null;
}

// Decode the stateless result param (?r=) enough to know the STYLE only.
// Mirrors encodeResult(): base64url of JSON { t, e:[connector,driver,educator], ig, ... }.
// Returns 'powerhouse' when integrated, else the top ext score. Never throws.
export function styleFromR(r) {
  try {
    const b64 = String(r).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(bytes));
    if (d.ig) return 'powerhouse';
    const e = d.e || [];
    const keys = ['connector', 'driver', 'educator'];
    let mi = 0;
    for (let i = 1; i < e.length; i++) if (e[i] > e[mi]) mi = i;
    return keys[mi] || null;
  } catch (_) {
    return null;
  }
}

// Style-only OG tags. Never renders zone, battery, or name into a share preview.
export function ogTags(style, host) {
  const name = NAMES[style];
  const art = /^[AEIOU]/i.test(name) ? 'an' : 'a';
  const title = `You're ${art} ${name}.`;
  const desc = 'Take the EnabledBD assessment and get your own plan.';
  const img = `${host}/static/share/${style}.png`;
  return {
    'og:title': title, 'twitter:title': title,
    'og:description': desc, 'twitter:description': desc,
    'og:image': img, 'twitter:image': img,
  };
}

export function setMeta(html, key, val) {
  const attr = key.indexOf('og:') === 0 ? 'property' : 'name';
  const re = new RegExp('(<meta ' + attr + '="' + key + '" content=")[^"]*(">)');
  return re.test(html) ? html.replace(re, '$1' + val + '$2') : html;
}

// Rewrite the served HTML: (1) point absolute OG urls at the ACTUAL host so
// previews work on the *.netlify.app preview and the final domain alike;
// (2) point og:url at the ACTUAL requested URL (with ?s=/?r=), so scrapers that
//     canonicalize via og:url don't fall back to the bare landing's card.
// (3) if a style is known, swap in the per-style tags. Style-only, always.
export function rewriteHtml(html, host, style, fullUrl) {
  html = html.split('https://assessment.enabledbd.com').join(host);
  if (fullUrl) html = setMeta(html, 'og:url', fullUrl);
  if (style) {
    const tags = ogTags(style, host);
    for (const k in tags) html = setMeta(html, k, tags[k]);
  }
  return html;
}
