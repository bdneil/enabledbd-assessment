// capture-lead.js
// Receives { name, email, profile, industry, ...scores } from the gate and
// writes it to the configured destination. The destination is swappable via
// env vars so you can move from a Google Sheet to your CRM/email platform
// without touching the front-end.
//
//   LEAD_DESTINATION = "sheet" (default) | "crm" | "both"
//   SHEET_ENDPOINT   = your Google Apps Script /exec URL   (for "sheet"/"both")
//   CRM_ENDPOINT     = your CRM/email-platform API URL      (for "crm"/"both")
//   CRM_API_KEY      = bearer token for the CRM endpoint     (for "crm"/"both")
//
// Node 18+ on Netlify provides a global `fetch`.

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(obj),
  };
}

// ---- Destination writers ---------------------------------------------------

async function writeToSheet(lead) {
  const url = process.env.SHEET_ENDPOINT;
  if (!url) { console.warn('capture-lead: SHEET_ENDPOINT not set — skipping sheet write'); return; }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(lead).toString(),
  });
  if (!res.ok) throw new Error(`Sheet write failed: ${res.status}`);
}

async function writeToCrm(lead) {
  const url = process.env.CRM_ENDPOINT;
  if (!url) { console.warn('capture-lead: CRM_ENDPOINT not set — skipping CRM write'); return; }
  // Adjust the body shape to match your CRM/ESP once you provide the endpoint.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.CRM_API_KEY ? { Authorization: `Bearer ${process.env.CRM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      email: lead.email,
      name: lead.name,
      fields: lead,
    }),
  });
  if (!res.ok) throw new Error(`CRM write failed: ${res.status}`);
}

// ---- HighLevel (GoHighLevel / LeadConnector) -------------------------------
const HL_BASE = 'https://services.leadconnectorhq.com';
const HL_VERSION = '2021-07-28';
// payload key -> HighLevel custom-field fieldKey (IDs are resolved at runtime)
const HL_FIELD_MAP = {
  signature: 'contact.signature', signature_line: 'contact.signature_line', foundationZone: 'contact.foundation_zone', industry: 'contact.industry',
  level: 'contact.level', instrument: 'contact.instrument_version', first_move: 'contact.first_move',
  playbook_url: 'contact.playbook_url', discrepancy: 'contact.discrepancy', style_scores: 'contact.style_scores',
};
let _hlFieldIds = null; // cached across warm invocations
async function hlFieldIds(loc, headers) {
  if (_hlFieldIds) return _hlFieldIds;
  const res = await fetch(`${HL_BASE}/locations/${loc}/customFields`, { headers });
  if (!res.ok) throw new Error(`HighLevel customFields fetch failed: ${res.status}`);
  const data = await res.json();
  const byKey = {};
  (data.customFields || []).forEach(f => { byKey[f.fieldKey] = f.id; });
  _hlFieldIds = byKey;
  return byKey;
}
async function writeToHighLevel(lead) {
  const token = process.env.HIGHLEVEL_TOKEN, loc = process.env.HIGHLEVEL_LOCATION_ID;
  if (!token || !loc) { console.warn('capture-lead: HIGHLEVEL_TOKEN/LOCATION_ID not set — skipping HighLevel'); return; }
  const headers = { Authorization: `Bearer ${token}`, Version: HL_VERSION, 'Content-Type': 'application/json', Accept: 'application/json' };
  const idByKey = await hlFieldIds(loc, headers);
  const customFields = [];
  for (const [leadKey, fk] of Object.entries(HL_FIELD_MAP)) {
    const id = idByKey[fk], val = lead[leadKey];
    if (id && val !== undefined && val !== null && val !== '') customFields.push({ id, value: String(val) });
  }
  const tags = ['ebd-assessment'];
  if (lead.track) tags.push('track-' + lead.track);
  if (lead.style) tags.push('style-' + lead.style);
  if (lead.batteryLevel) tags.push('battery-' + lead.batteryLevel);
  if (lead.source) tags.push(lead.source);            // tester / live
  if (lead.waitlist) tags.push('community-waitlist');
  if (lead.newsletter) tags.push('newsletter sign up');
  const body = { locationId: loc, firstName: lead.name, email: lead.email, tags, customFields, source: 'EnabledBD Assessment' };
  const res = await fetch(`${HL_BASE}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text(); throw new Error(`HighLevel upsert failed: ${res.status} ${t.slice(0, 200)}`); }
}

async function writeLead(lead) {
  const dest = (process.env.LEAD_DESTINATION || 'sheet').toLowerCase();
  if (dest === 'sheet') return writeToSheet(lead);
  if (dest === 'highlevel') return writeToHighLevel(lead);
  if (dest === 'crm') return writeToCrm(lead);
  if (dest === 'both') {
    // HighLevel is where the humans live; the Sheet is the raw backup log.
    const results = await Promise.allSettled([writeToHighLevel(lead), writeToSheet(lead)]);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length === results.length) throw new Error('All lead destinations failed');
    failed.forEach(f => console.warn('capture-lead: one destination failed:', f.reason));
    return;
  }
  throw new Error(`Unknown LEAD_DESTINATION: ${dest}`);
}

// ---- Handler ---------------------------------------------------------------

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method Not Allowed' });
  }

  let lead;
  try {
    lead = JSON.parse(event.body || '{}');
  } catch (_) {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON body' });
  }

  // Minimal server-side validation; the client validates too.
  const email = (lead.email || '').trim();
  const name = (lead.name || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { ok: false, error: 'Name and a valid email are required' });
  }
  lead.name = name;
  lead.email = email;
  if (!lead.timestamp) lead.timestamp = new Date().toISOString();

  try {
    await writeLead(lead);
    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('capture-lead failed:', err);
    // Return 200 so the user still gets their playbook — the lead is logged for
    // recovery even if the destination is briefly down.
    return jsonResponse(200, { ok: false, warning: 'Lead accepted but destination write failed' });
  }
};
