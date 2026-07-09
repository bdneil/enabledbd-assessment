// Netlify Edge Function: inject per-style Open Graph tags for result (?r=) and
// share (?s=) links so social previews are personalized — style only, never
// zone/battery/name. Defensive: ANY failure falls through to the original page,
// so it can degrade to the generic card but never break page delivery.
import { normalizeStyle, styleFromR, rewriteHtml } from './lib/og-lib.mjs';

export default async (request, context) => {
  const res = await context.next();
  try {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return res;

    const url = new URL(request.url);
    const host = url.origin;
    let style = normalizeStyle(url.searchParams.get('s'));
    if (!style && url.searchParams.get('r')) style = styleFromR(url.searchParams.get('r'));

    const html = rewriteHtml(await res.text(), host, style);
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    return new Response(html, { status: res.status, headers });
  } catch (_) {
    return res; // graceful fallback: unmodified page (generic OG)
  }
};

export const config = { path: '/' };
