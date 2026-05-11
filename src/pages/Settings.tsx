import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, fetchSpreadsheetTitle } from '../store';
import { ExternalLink, Repeat, Target } from '../components/icons';

export default function SettingsPage() {
  const { settings, setSettings, signOut, rebuildDashboard, resetSpreadsheet, bootstrap } = useStore();
  const [name, setName] = useState(settings.userName);
  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [sheetId, setSheetId] = useState(settings.spreadsheetId);
  const [title, setTitle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Look up spreadsheet title once.
  useState(() => {
    if (settings.spreadsheetId) {
      fetchSpreadsheetTitle(settings.spreadsheetId).then(setTitle).catch(() => setTitle(null));
    }
    return undefined;
  });

  const sheetUrl = settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Settings</h1>

      <nav className="grid grid-cols-2 gap-3">
        <Link to="/recurring" className="card flex items-center gap-3 hover:bg-slate-800/50">
          <Repeat className="w-5 h-5 text-brand-500" /> <span>Recurring</span>
        </Link>
        <Link to="/budgets" className="card flex items-center gap-3 hover:bg-slate-800/50">
          <Target className="w-5 h-5 text-brand-500" /> <span>Budgets</span>
        </Link>
      </nav>

      <section className="card space-y-3">
        <h2 className="font-medium">Profile</h2>
        <div>
          <label className="label">Display name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Currency (ISO)</label>
            <input className="input uppercase" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Locale</label>
            <input className="input" value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en-PH" />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setSettings({ userName: name, currency, locale })}
        >
          Save profile
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Google Sheet</h2>
        {sheetUrl && (
          <div className="text-sm">
            Connected to:{' '}
            <a className="text-brand-500 inline-flex items-center gap-1" href={sheetUrl} target="_blank" rel="noreferrer">
              {title ?? settings.spreadsheetId}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        <div>
          <label className="label">Change spreadsheet (paste ID or URL)</label>
          <input className="input" value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const id = extractId(sheetId.trim());
                setSettings({ spreadsheetId: id });
                await fetchSpreadsheetTitle(id);
                await bootstrap();
                setTitle(await fetchSpreadsheetTitle(id));
                alert('Connected.');
              } catch (e: any) {
                alert(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Connect & bootstrap
          </button>
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try { await rebuildDashboard(); alert('Dashboard rebuilt.'); }
              catch (e: any) { alert(e.message); }
              finally { setBusy(false); }
            }}
          >
            Rebuild dashboard
          </button>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Danger Zone</h2>
        <p className="text-sm text-slate-400">
          These actions affect your Google Sheet directly. They cannot be undone except by restoring a Google Sheets revision history snapshot.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Wipe ALL data in the connected spreadsheet (accounts, categories, transactions, budgets, recurring) and re-seed defaults?')) return;
              setBusy(true);
              try { await resetSpreadsheet(); alert('Reset complete.'); }
              catch (e: any) { alert(e.message); }
              finally { setBusy(false); }
            }}
          >
            Reset spreadsheet data
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (!window.confirm('Sign out and clear local settings (spreadsheet link, name, currency)? Your Google Sheet is not deleted.')) return;
              localStorage.clear();
              signOut();
              location.reload();
            }}
          >
            Sign out & switch user
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="font-medium mb-2">About</h2>
        <p className="text-sm text-slate-400">
          Jaira Finance v0.1 · Your data lives in Google Sheets. The dashboard tab updates via formulas and works fully offline in Sheets.
        </p>
      </section>
    </div>
  );
}

function extractId(input: string): string {
  const m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : input;
}
