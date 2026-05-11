# Jaira Finance

A personal finance tracker that lives in **your own Google Sheet**. Works on phone & desktop, installable as a PWA, and the Sheet itself has a formula-driven dashboard so you can browse your finances offline directly in Google Sheets.

## Features

- ✅ Log **expense / income / transfer** transactions
- ✅ Manage **accounts** and **account types** (asset / liability)
- ✅ Manage your own **expense & income categories** (with emojis)
- ✅ Auto-creates a new **yearly tab** when a new year rolls in
- ✅ Per-year **dashboard tab** with formulas — readable offline in Sheets
- ✅ **Recurring transactions** with daily/weekly/monthly cadence
- ✅ **Monthly budgets** per category with progress bars
- ✅ In-app **charts** (recharts) separate from the Sheet dashboard
- ✅ **Settings**: rename yourself, change currency/locale, switch spreadsheet, reset data, sign out / switch user
- ✅ **PWA**: installable on iOS/Android home screen, app-shell cached

## Architecture

- **React + Vite + TypeScript + Tailwind**
- Sign-in via **Google Identity Services** (browser-side OAuth, no server)
- All data stored in a **Google Sheet** you own (one spreadsheet, many tabs)
- Local state via **Zustand**; settings persisted in `localStorage` (only the spreadsheet ID, name, currency, locale)
- The access token lives in memory only — it is *never* stored

```
Google Sheet
├── Settings           key/value
├── AccountTypes       id | name | kind
├── Accounts           id | name | typeId | openingBalance | archived
├── Categories         id | name | kind | emoji | archived
├── Recurring          id | active | kind | amount | accountId | toAccountId | categoryId | note | cadence | interval | startDate | nextDue | endDate
├── Budgets            id | categoryId | monthlyLimit
├── 2026               id | date | kind | amount | accountId | toAccountId | categoryId | note | createdAt
├── Dashboard 2026     formulas (income/expense/net per month, top categories, etc.)
├── 2027               (auto-created on Jan 1, 2027)
└── Dashboard 2027     (auto-created with 2027)
```

## Setup (one-time)

### 0. Prerequisites

- **Node.js 20 LTS** (Vite 5 requires Node ≥ 18; your current Node may be too old).
  Install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # restart shell, then:
  nvm install 20
  nvm use 20
  ```

### 1. Google Cloud project for OAuth

You need an OAuth Client ID so the app can sign you in and write to your Sheet. This is free.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project (or pick one).
2. **Enable APIs**:
   - APIs & Services → Library → enable **Google Sheets API**
   - Same place → enable **Google Drive API** (used to list your spreadsheets and create new ones)
3. **OAuth consent screen**:
   - User type: **External** (use your own Gmail).
   - Add yourself as a **Test user**.
   - Scopes: you can leave defaults (the app requests scopes at runtime).
4. **Credentials** → *Create credentials* → **OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - (later) your deployed origin, e.g. `https://your-username.github.io`
   - Click *Create*. Copy the **Client ID**.

### 2. Configure the app

```bash
cp .env.example .env.local
# then edit .env.local and paste your Client ID:
# VITE_GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Sign in, choose to **create a new spreadsheet** (recommended) or pick an existing one. Jaira will set up all tabs and the dashboard automatically.

### 4. (Optional) Install on your phone

- Open the dev URL on your phone (same Wi-Fi). Vite is configured with `host: true`, so visit `http://<your-mac-ip>:5173`.
- Or deploy and visit the deployed URL.
- iOS: Safari → Share → *Add to Home Screen*.
- Android: Chrome → menu → *Install app*.

> Tip: Apple's PWA security requires HTTPS, so for full PWA install on iPhone, deploy first.

## Deploy

Any static host works. Two easy options:

### GitHub Pages
```bash
npm run build
# push the dist/ folder via gh-pages, or use the official Pages action
```
After deploying, add the deployed origin to *Authorized JavaScript origins* in the Cloud Console.

### Netlify / Vercel
- Connect the repo. Build command `npm run build`, output `dist`.
- Add `VITE_GOOGLE_CLIENT_ID` as an environment variable.
- Add the deployed origin to your OAuth client's authorized origins.

## Day-to-day usage

- **Add transaction** — big `+` button bottom-right.
- **New year** — when you log a transaction dated in a new year, the matching `YYYY` and `Dashboard YYYY` tabs are created automatically. You can also pick a year from the dropdown in the header.
- **Recurring** — Settings → Recurring → *New*. Press *Run due now* to materialize anything due (also runs automatically every time you sign in / load the app).
- **Reset / switch user** — Settings → Danger Zone.
- **Open the Sheet** — Settings → click your spreadsheet name. The `Dashboard YYYY` tab is your offline view.

## Security notes

- The OAuth scope used is `spreadsheets` + `drive.file` (drive.file lets the app see/create files **the app itself created**, plus any you explicitly pick — it does *not* see your full Drive).
- The access token is held only in memory; refresh requires re-prompting Google silently.
- Your data never goes through any third-party server. Browser ↔ Google directly.

## Roadmap ideas (not in v0.1)

- Search / filter transaction list
- CSV import
- Multi-currency per account with FX
- Sharing the Sheet with another person while keeping personal categories
- Real PWA offline write-queue (currently the entry form requires connectivity)

## License

Private project. © Jaira.
