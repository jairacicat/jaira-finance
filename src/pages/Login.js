import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useStore, fetchSpreadsheetTitle } from '../store';
import { createSpreadsheet, listMySpreadsheets, isConfigured, getUserEmail } from '../lib/google';
import { ExternalLink } from '../components/icons';
export default function Login() {
    const { signedIn, signIn, settings, setSettings, bootstrap, status, error } = useStore();
    const [list, setList] = useState(null);
    const [newName, setNewName] = useState('My Finance Tracker');
    const [pasteId, setPasteId] = useState('');
    const [stage, setStage] = useState(settings.userName ? 'sheet' : 'name');
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
        return (_jsxs(Center, { children: [_jsx("h1", { className: "text-2xl font-semibold mb-2", children: "Setup needed" }), _jsx("p", { className: "text-slate-300 mb-4", children: "You need to add your Google OAuth Client ID before signing in." }), _jsxs("ol", { className: "text-left text-sm text-slate-300 space-y-2 list-decimal list-inside max-w-md", children: [_jsxs("li", { children: ["Create a Google Cloud project and enable ", _jsx("em", { children: "Google Sheets API" }), " + ", _jsx("em", { children: "Google Drive API" }), "."] }), _jsxs("li", { children: ["Create an ", _jsx("strong", { children: "OAuth Client ID" }), " (type: Web application)."] }), _jsxs("li", { children: ["Add ", _jsx("code", { className: "bg-slate-800 px-1 rounded", children: "http://localhost:5173" }), " to ", _jsx("em", { children: "Authorized JavaScript origins" }), "."] }), _jsxs("li", { children: ["Copy the Client ID into ", _jsx("code", { className: "bg-slate-800 px-1 rounded", children: ".env.local" }), " as ", _jsx("code", { children: "VITE_GOOGLE_CLIENT_ID" }), "."] }), _jsxs("li", { children: ["Restart ", _jsx("code", { children: "npm run dev" }), "."] })] }), _jsx("p", { className: "text-xs text-slate-500 mt-4", children: "See README for the full walkthrough." })] }));
    }
    if (!signedIn) {
        return (_jsxs(Center, { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight mb-2", children: "Jaira Finance" }), _jsx("p", { className: "text-slate-400 mb-8", children: "Personal finance tracker that lives in your Google Sheet." }), _jsx("button", { className: "btn-primary", onClick: signIn, disabled: status === 'loading', children: status === 'loading' ? 'Signing in…' : 'Sign in with Google' }), error && _jsx("p", { className: "text-rose-400 text-sm mt-4", children: error })] }));
    }
    if (stage === 'name') {
        return (_jsxs(Center, { children: [_jsxs("h1", { className: "text-2xl font-semibold mb-1", children: ["Welcome, ", getUserEmail()] }), _jsx("p", { className: "text-slate-400 mb-6", children: "What should we call you?" }), _jsxs("div", { className: "w-full max-w-sm space-y-3", children: [_jsx("input", { className: "input", placeholder: "Your name", value: userName, onChange: (e) => setUserName(e.target.value), autoFocus: true }), _jsx("button", { className: "btn-primary w-full", disabled: !userName.trim(), onClick: () => {
                                setSettings({ userName: userName.trim() });
                                setStage('sheet');
                            }, children: "Continue" })] })] }));
    }
    // stage 'sheet'
    return (_jsxs(Center, { children: [_jsx("h1", { className: "text-2xl font-semibold mb-1", children: "Pick your Google Sheet" }), _jsx("p", { className: "text-slate-400 mb-6 text-center max-w-md", children: "Choose an existing spreadsheet, paste an ID, or create a new one. Jaira will set up the tabs and dashboard for you." }), _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsxs("section", { className: "card space-y-3", children: [_jsx("h2", { className: "font-medium", children: "Create new spreadsheet" }), _jsx("input", { className: "input", value: newName, onChange: (e) => setNewName(e.target.value) }), _jsx("button", { className: "btn-primary w-full", disabled: busy || !newName.trim(), onClick: async () => {
                                    setBusy(true);
                                    try {
                                        const r = await createSpreadsheet(newName.trim());
                                        setSettings({ spreadsheetId: r.spreadsheetId });
                                        await bootstrap();
                                    }
                                    catch (e) {
                                        alert(e.message);
                                    }
                                    finally {
                                        setBusy(false);
                                    }
                                }, children: busy ? 'Creating…' : 'Create & Connect' })] }), _jsxs("section", { className: "card space-y-3", children: [_jsx("h2", { className: "font-medium", children: "Use an existing spreadsheet" }), list === null && _jsx("p", { className: "text-slate-400 text-sm", children: "Loading\u2026" }), list && list.length === 0 && _jsx("p", { className: "text-slate-400 text-sm", children: "None found." }), list && list.length > 0 && (_jsx("ul", { className: "max-h-48 overflow-auto divide-y divide-slate-800 -mx-2", children: list.map((s) => (_jsx("li", { children: _jsx("button", { className: "w-full text-left px-2 py-2 hover:bg-slate-800 rounded-lg text-sm", disabled: busy, onClick: async () => {
                                            setBusy(true);
                                            try {
                                                setSettings({ spreadsheetId: s.id });
                                                await bootstrap();
                                            }
                                            catch (e) {
                                                alert(e.message);
                                            }
                                            finally {
                                                setBusy(false);
                                            }
                                        }, children: s.name }) }, s.id))) })), _jsxs("div", { className: "pt-2 border-t border-slate-800 space-y-2", children: [_jsx("div", { className: "text-xs text-slate-400", children: "\u2026or paste a spreadsheet ID / URL" }), _jsx("input", { className: "input", placeholder: "Spreadsheet ID or URL", value: pasteId, onChange: (e) => setPasteId(e.target.value) }), _jsx("button", { className: "btn-secondary w-full", disabled: busy || !pasteId.trim(), onClick: async () => {
                                            setBusy(true);
                                            try {
                                                const id = extractId(pasteId.trim());
                                                setSettings({ spreadsheetId: id });
                                                await fetchSpreadsheetTitle(id); // validates
                                                await bootstrap();
                                            }
                                            catch (e) {
                                                alert(e.message);
                                            }
                                            finally {
                                                setBusy(false);
                                            }
                                        }, children: "Connect" })] })] }), _jsxs("a", { href: "https://sheets.google.com", target: "_blank", rel: "noreferrer", className: "text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1", children: ["Open Google Sheets ", _jsx(ExternalLink, { className: "w-3 h-3" })] })] }), error && _jsx("p", { className: "text-rose-400 text-sm mt-4", children: error })] }));
}
function Center({ children }) {
    return (_jsx("div", { className: "min-h-screen flex flex-col items-center justify-center p-6 text-center", children: children }));
}
function extractId(input) {
    const m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (m)
        return m[1];
    return input;
}
