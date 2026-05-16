// Submission transport.
//
// In production (GitHub Pages) we POST each case to a Google Apps Script web
// app that appends a row to a Google Sheet. The URL comes from a Vite env
// variable set in .env.local or via the host's environment:
//
//     VITE_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
//
// We send the payload as application/x-www-form-urlencoded so the request
// stays a "simple" CORS request and the browser does not issue an OPTIONS
// preflight (Apps Script does not respond to OPTIONS).

export const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || '';

export async function submitCase(payload) {
  if (!WEBHOOK_URL) {
    return { ok: false, skipped: true, reason: 'no-webhook-configured' };
  }
  try {
    const body = new URLSearchParams({ payload: JSON.stringify(payload) });
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body,
      // No custom Content-Type so the browser sends
      // application/x-www-form-urlencoded; charset=UTF-8 (simple request).
      redirect: 'follow',
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
