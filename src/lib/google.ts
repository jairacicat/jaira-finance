// Google Identity Services (OAuth token client) + Sheets REST API helpers.
// All requests go directly from the browser. We only ever store the access token
// in memory; refresh = silent re-prompt via GIS.

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let userEmail: string | null = null;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

export function getUserEmail(): string | null {
  return userEmail;
}

function ensureGisLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - start > 8000) return reject(new Error('Google Identity Services failed to load'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

export async function signIn(interactive = true): Promise<string> {
  if (!CLIENT_ID) throw new Error('Missing VITE_GOOGLE_CLIENT_ID. See README.');
  await ensureGisLoaded();
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt: interactive ? '' : 'none',
      callback: (resp) => {
        if ((resp as any).error) return reject(new Error((resp as any).error));
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + Number(resp.expires_in ?? 3600) * 1000 - 60_000;
        // Best-effort: fetch user info
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((info) => {
            if (info?.email) userEmail = info.email;
          })
          .catch(() => {});
        resolve(accessToken!);
      }
    });
    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : 'none' });
  });
}

export function signOut() {
  if (accessToken) {
    try {
      google.accounts.oauth2.revoke(accessToken, () => {});
    } catch {}
  }
  accessToken = null;
  tokenExpiresAt = 0;
  userEmail = null;
}

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;
  return signIn(false).catch(() => signIn(true));
}

async function api<T = any>(url: string, init: RequestInit = {}): Promise<T> {
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
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Spreadsheet helpers ----------

export async function createSpreadsheet(title: string): Promise<{ spreadsheetId: string }> {
  const out = await api<{ spreadsheetId: string }>(`${SHEETS}`, {
    method: 'POST',
    body: JSON.stringify({ properties: { title } })
  });
  return out;
}

export async function getSpreadsheetMeta(spreadsheetId: string) {
  return api<any>(`${SHEETS}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`);
}

export async function listMySpreadsheets() {
  return api<{ files: { id: string; name: string; modifiedTime: string }[] }>(
    `${DRIVE}?q=${encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=25`
  );
}

export async function getValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const data = await api<{ values?: string[][] }>(
    `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`
  );
  return data.values ?? [];
}

export async function setValues(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][]
) {
  return api(
    `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    { method: 'PUT', body: JSON.stringify({ values }) }
  );
}

export async function appendValues(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][]
) {
  return api(
    `${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values }) }
  );
}

export async function clearRange(spreadsheetId: string, range: string) {
  return api(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
    method: 'POST',
    body: '{}'
  });
}

export async function batchUpdate(spreadsheetId: string, requests: any[]) {
  return api<any>(`${SHEETS}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests })
  });
}
