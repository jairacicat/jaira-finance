// Google Identity Services (OAuth token client) + Sheets REST API helpers.
// All requests go directly from the browser. We only ever store the access token
// in memory; refresh = silent re-prompt via GIS.
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
let accessToken = null;
let tokenExpiresAt = 0;
let tokenClient = null;
let userEmail = null;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export function isConfigured() {
    return Boolean(CLIENT_ID);
}
export function getUserEmail() {
    return userEmail;
}
function ensureGisLoaded() {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
            if (window.google?.accounts?.oauth2)
                return resolve();
            if (Date.now() - start > 8000)
                return reject(new Error('Google Identity Services failed to load'));
            setTimeout(tick, 50);
        };
        tick();
    });
}
export async function signIn(interactive = true) {
    if (!CLIENT_ID)
        throw new Error('Missing VITE_GOOGLE_CLIENT_ID. See README.');
    await ensureGisLoaded();
    return new Promise((resolve, reject) => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            prompt: interactive ? '' : 'none',
            callback: (resp) => {
                if (resp.error)
                    return reject(new Error(resp.error));
                accessToken = resp.access_token;
                tokenExpiresAt = Date.now() + Number(resp.expires_in ?? 3600) * 1000 - 60_000;
                // Best-effort: fetch user info
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((info) => {
                    if (info?.email)
                        userEmail = info.email;
                })
                    .catch(() => { });
                resolve(accessToken);
            }
        });
        tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : 'none' });
    });
}
export function signOut() {
    if (accessToken) {
        try {
            google.accounts.oauth2.revoke(accessToken, () => { });
        }
        catch { }
    }
    accessToken = null;
    tokenExpiresAt = 0;
    userEmail = null;
}
async function getToken() {
    if (accessToken && Date.now() < tokenExpiresAt)
        return accessToken;
    return signIn(false).catch(() => signIn(true));
}
async function api(url, init = {}) {
    const token = await getToken();
    const res = await fetch(url, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google API ${res.status}: ${text}`);
    }
    if (res.status === 204)
        return undefined;
    return res.json();
}
// ---------- Spreadsheet helpers ----------
export async function createSpreadsheet(title) {
    const out = await api(`${SHEETS}`, {
        method: 'POST',
        body: JSON.stringify({ properties: { title } })
    });
    return out;
}
export async function getSpreadsheetMeta(spreadsheetId) {
    return api(`${SHEETS}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`);
}
export async function listMySpreadsheets() {
    return api(`${DRIVE}?q=${encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=25`);
}
export async function getValues(spreadsheetId, range) {
    const data = await api(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`);
    return data.values ?? [];
}
export async function setValues(spreadsheetId, range, values) {
    return api(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, { method: 'PUT', body: JSON.stringify({ values }) });
}
export async function appendValues(spreadsheetId, range, values) {
    return api(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, { method: 'POST', body: JSON.stringify({ values }) });
}
export async function clearRange(spreadsheetId, range) {
    return api(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
        method: 'POST',
        body: '{}'
    });
}
export async function batchUpdate(spreadsheetId, requests) {
    return api(`${SHEETS}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({ requests })
    });
}
