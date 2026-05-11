import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Home, Plus, Wallet, Tag, BarChart3, Settings as Cog, RefreshCw } from './icons';
export default function Layout({ children }) {
    const { settings, status, lastSyncAt, refresh, year, setYear } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsxs("header", { className: "safe-top sticky top-0 z-30 backdrop-blur bg-slate-950/80 border-b border-slate-900", children: [_jsxs("div", { className: "max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3", children: [_jsxs("button", { onClick: () => navigate('/'), className: "text-left", "aria-label": "Home", children: [_jsx("div", { className: "text-base font-semibold leading-tight", children: settings.userName ? `Hi, ${settings.userName}` : 'Jaira Finance' }), _jsxs("div", { className: "text-xs text-slate-400", children: [settings.currency, " \u00B7 ", settings.locale] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("select", { value: year, onChange: (e) => setYear(Number(e.target.value)), className: "bg-slate-900 border border-slate-800 rounded-lg text-sm px-2 py-1", "aria-label": "Year", children: yearOptions().map((y) => (_jsx("option", { value: y, children: y }, y))) }), _jsx("button", { className: "btn-ghost px-2 py-2", onClick: () => refresh(), disabled: status === 'syncing', "aria-label": "Refresh", title: "Refresh from Google Sheet", children: _jsx(RefreshCw, { className: `w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}` }) })] })] }), status === 'error' && (_jsx("div", { className: "bg-rose-900/40 text-rose-200 text-sm px-4 py-2 text-center", children: useStore.getState().error }))] }), _jsxs("main", { className: "flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-28", children: [children, lastSyncAt && (_jsxs("div", { className: "text-center text-xs text-slate-500 mt-6", children: ["Last synced ", new Date(lastSyncAt).toLocaleTimeString()] }))] }), location.pathname !== '/add' && (_jsx("button", { onClick: () => navigate('/add'), className: "fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 rounded-full w-14 h-14 bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/40 flex items-center justify-center", "aria-label": "Add transaction", children: _jsx(Plus, { className: "w-6 h-6 text-white" }) })), _jsx("nav", { className: "safe-bottom fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-900", children: _jsxs("div", { className: "max-w-3xl mx-auto grid grid-cols-5 text-xs", children: [_jsx(NavTab, { to: "/", icon: _jsx(Home, { className: "w-5 h-5" }), label: "Home" }), _jsx(NavTab, { to: "/charts", icon: _jsx(BarChart3, { className: "w-5 h-5" }), label: "Charts" }), _jsx(NavTab, { to: "/accounts", icon: _jsx(Wallet, { className: "w-5 h-5" }), label: "Accounts" }), _jsx(NavTab, { to: "/categories", icon: _jsx(Tag, { className: "w-5 h-5" }), label: "Tags" }), _jsx(NavTab, { to: "/settings", icon: _jsx(Cog, { className: "w-5 h-5" }), label: "More" })] }) })] }));
}
function NavTab({ to, icon, label }) {
    return (_jsxs(NavLink, { to: to, end: to === '/', className: ({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? 'text-brand-500' : 'text-slate-400 hover:text-slate-200'}`, children: [icon, _jsx("span", { className: "mt-0.5", children: label })] }));
}
function yearOptions() {
    const now = new Date().getFullYear();
    const out = [];
    for (let y = now - 4; y <= now + 1; y++)
        out.push(y);
    return out.reverse();
}
