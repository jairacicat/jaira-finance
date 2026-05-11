import { useEffect, useState } from 'react';
import { useStore, fetchSpreadsheetTitle } from '../store';
import { createSpreadsheet, listMySpreadsheets, isConfigured, getUserEmail } from '../lib/google';
import { ExternalLink } from '../components/icons';

export default function Login() {
  const { signedIn, signIn, settings, setSettings, bootstrap, status, error } = useStore();
  const [list, setList] = useState<{ id: string; name: string }[] | null>(null);
  const [newName, setNewName] = useState('My Finance Tracker');
  const [pasteId, setPasteId] = useState('');
  const [stage, setStage] = useState<'name' | 'sheet' | 'done'>(settings.userName ? 'sheet' : 'name');
  const [userName, setUserName] = useState(settings.userName);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signedIn) {
      listMySpreadsheets()
        .then((r) => setList(r.files.map((f) => ({ id: f.id, name: f.name }))))
        .catch(() => setList([]));
    }
  }, [signedIn]);

  if (!isConfigured()) {
    return (
      <Center>
        <h1 className="text-2xl font-semibold mb-2">Setup needed</h1>
        <p className="text-slate-300 mb-4">
          You need to add your Google OAuth Client ID before signing in.
        </p>
        <ol className="text-left text-sm text-slate-300 space-y-2 list-decimal list-inside max-w-md">
          <li>Create a Google Cloud project and enable <em>Google Sheets API</em> + <em>Google Drive API</em>.</li>
          <li>Create an <strong>OAuth Client ID</strong> (type: Web application).</li>
          <li>Add <code className="bg-slate-800 px-1 rounded">http://localhost:5173</code> to <em>Authorized JavaScript origins</em>.</li>
          <li>Copy the Client ID into <code className="bg-slate-800 px-1 rounded">.env.local</code> as <code>VITE_GOOGLE_CLIENT_ID</code>.</li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
        <p className="text-xs text-slate-500 mt-4">See README for the full walkthrough.</p>
      </Center>
    );
  }

  if (!signedIn) {
    return (
      <Center>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Jaira Finance</h1>
        <p className="text-slate-400 mb-8">Personal finance tracker that lives in your Google Sheet.</p>
        <button className="btn-primary" onClick={signIn} disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
      </Center>
    );
  }

  if (stage === 'name') {
    return (
      <Center>
        <h1 className="text-2xl font-semibold mb-1">Welcome, {getUserEmail()}</h1>
        <p className="text-slate-400 mb-6">What should we call you?</p>
        <div className="w-full max-w-sm space-y-3">
          <input
            className="input"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoFocus
          />
          <button
            className="btn-primary w-full"
            disabled={!userName.trim()}
            onClick={() => {
              setSettings({ userName: userName.trim() });
              setStage('sheet');
            }}
          >
            Continue
          </button>
        </div>
      </Center>
    );
  }

  // stage 'sheet'
  return (
    <Center>
      <h1 className="text-2xl font-semibold mb-1">Pick your Google Sheet</h1>
      <p className="text-slate-400 mb-6 text-center max-w-md">
        Choose an existing spreadsheet, paste an ID, or create a new one. Jaira will set up the tabs and dashboard for you.
      </p>

      <div className="w-full max-w-md space-y-6">
        <section className="card space-y-3">
          <h2 className="font-medium">Create new spreadsheet</h2>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button
            className="btn-primary w-full"
            disabled={busy || !newName.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await createSpreadsheet(newName.trim());
                setSettings({ spreadsheetId: r.spreadsheetId });
                await bootstrap();
              } catch (e: any) {
                alert(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Creating…' : 'Create & Connect'}
          </button>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium">Use an existing spreadsheet</h2>
          {list === null && <p className="text-slate-400 text-sm">Loading…</p>}
          {list && list.length === 0 && <p className="text-slate-400 text-sm">None found.</p>}
          {list && list.length > 0 && (
            <ul className="max-h-48 overflow-auto divide-y divide-slate-800 -mx-2">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    className="w-full text-left px-2 py-2 hover:bg-slate-800 rounded-lg text-sm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        setSettings({ spreadsheetId: s.id });
                        await bootstrap();
                      } catch (e: any) {
                        alert(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-xs text-slate-400">…or paste a spreadsheet ID / URL</div>
            <input className="input" placeholder="Spreadsheet ID or URL" value={pasteId} onChange={(e) => setPasteId(e.target.value)} />
            <button
              className="btn-secondary w-full"
              disabled={busy || !pasteId.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  const id = extractId(pasteId.trim());
                  setSettings({ spreadsheetId: id });
                  await fetchSpreadsheetTitle(id); // validates
                  await bootstrap();
                } catch (e: any) {
                  alert(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Connect
            </button>
          </div>
        </section>

        <a
          href="https://sheets.google.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
        >
          Open Google Sheets <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {children}
    </div>
  );
}

function extractId(input: string): string {
  const m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  return input;
}
