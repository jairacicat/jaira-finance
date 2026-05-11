import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [title, setTitle] = useState(null);
    const [busy, setBusy] = useState(false);
    // Look up spreadsheet title once.
    useState(() => {
        if (settings.spreadsheetId) {
            fetchSpreadsheetTitle(settings.spreadsheetId).then(setTitle).catch(() => setTitle(null));
        }
        return undefined;
    });
    const sheetUrl = settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : null;
    return (_jsxs("div", { className: "space-y-5", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Settings" }), _jsxs("nav", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Link, { to: "/recurring", className: "card flex items-center gap-3 hover:bg-slate-800/50", children: [_jsx(Repeat, { className: "w-5 h-5 text-brand-500" }), " ", _jsx("span", { children: "Recurring" })] }), _jsxs(Link, { to: "/budgets", className: "card flex items-center gap-3 hover:bg-slate-800/50", children: [_jsx(Target, { className: "w-5 h-5 text-brand-500" }), " ", _jsx("span", { children: "Budgets" })] })] }), _jsxs("section", { className: "card space-y-3", children: [_jsx("h2", { className: "font-medium", children: "Profile" }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Display name" }), _jsx("input", { className: "input", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Currency (ISO)" }), _jsx("input", { className: "input uppercase", value: currency, maxLength: 3, onChange: (e) => setCurrency(e.target.value.toUpperCase()) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Locale" }), _jsx("input", { className: "input", value: locale, onChange: (e) => setLocale(e.target.value), placeholder: "en-PH" })] })] }), _jsx("button", { className: "btn-primary", onClick: () => setSettings({ userName: name, currency, locale }), children: "Save profile" })] }), _jsxs("section", { className: "card space-y-3", children: [_jsx("h2", { className: "font-medium", children: "Google Sheet" }), sheetUrl && (_jsxs("div", { className: "text-sm", children: ["Connected to:", ' ', _jsxs("a", { className: "text-brand-500 inline-flex items-center gap-1", href: sheetUrl, target: "_blank", rel: "noreferrer", children: [title ?? settings.spreadsheetId, _jsx(ExternalLink, { className: "w-3 h-3" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Change spreadsheet (paste ID or URL)" }), _jsx("input", { className: "input", value: sheetId, onChange: (e) => setSheetId(e.target.value) })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { className: "btn-secondary", disabled: busy, onClick: async () => {
                                    setBusy(true);
                                    try {
                                        const id = extractId(sheetId.trim());
                                        setSettings({ spreadsheetId: id });
                                        await fetchSpreadsheetTitle(id);
                                        await bootstrap();
                                        setTitle(await fetchSpreadsheetTitle(id));
                                        alert('Connected.');
                                    }
                                    catch (e) {
                                        alert(e.message);
                                    }
                                    finally {
                                        setBusy(false);
                                    }
                                }, children: "Connect & bootstrap" }), _jsx("button", { className: "btn-secondary", disabled: busy, onClick: async () => {
                                    setBusy(true);
                                    try {
                                        await rebuildDashboard();
                                        alert('Dashboard rebuilt.');
                                    }
                                    catch (e) {
                                        alert(e.message);
                                    }
                                    finally {
                                        setBusy(false);
                                    }
                                }, children: "Rebuild dashboard" })] })] }), _jsxs("section", { className: "card space-y-3", children: [_jsx("h2", { className: "font-medium", children: "Danger Zone" }), _jsx("p", { className: "text-sm text-slate-400", children: "These actions affect your Google Sheet directly. They cannot be undone except by restoring a Google Sheets revision history snapshot." }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { className: "btn-danger", disabled: busy, onClick: async () => {
                                    if (!window.confirm('Wipe ALL data in the connected spreadsheet (accounts, categories, transactions, budgets, recurring) and re-seed defaults?'))
                                        return;
                                    setBusy(true);
                                    try {
                                        await resetSpreadsheet();
                                        alert('Reset complete.');
                                    }
                                    catch (e) {
                                        alert(e.message);
                                    }
                                    finally {
                                        setBusy(false);
                                    }
                                }, children: "Reset spreadsheet data" }), _jsx("button", { className: "btn-danger", onClick: () => {
                                    if (!window.confirm('Sign out and clear local settings (spreadsheet link, name, currency)? Your Google Sheet is not deleted.'))
                                        return;
                                    localStorage.clear();
                                    signOut();
                                    location.reload();
                                }, children: "Sign out & switch user" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { className: "font-medium mb-2", children: "About" }), _jsx("p", { className: "text-sm text-slate-400", children: "Jaira Finance v0.1 \u00B7 Your data lives in Google Sheets. The dashboard tab updates via formulas and works fully offline in Sheets." })] })] }));
}
function extractId(input) {
    const m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : input;
}
