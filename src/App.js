import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import RecurringPage from './pages/Recurring';
import Budgets from './pages/Budgets';
import Charts from './pages/Charts';
import Settings from './pages/Settings';
export default function App() {
    const { signedIn, settings } = useStore();
    // Auto silent sign-in if we previously had a spreadsheet configured.
    useEffect(() => {
        if (!signedIn && settings.spreadsheetId) {
            useStore.getState().signIn().catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    if (!signedIn || !settings.spreadsheetId) {
        return _jsx(Login, {});
    }
    return (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/add", element: _jsx(AddTransaction, {}) }), _jsx(Route, { path: "/accounts", element: _jsx(Accounts, {}) }), _jsx(Route, { path: "/categories", element: _jsx(Categories, {}) }), _jsx(Route, { path: "/recurring", element: _jsx(RecurringPage, {}) }), _jsx(Route, { path: "/budgets", element: _jsx(Budgets, {}) }), _jsx(Route, { path: "/charts", element: _jsx(Charts, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
