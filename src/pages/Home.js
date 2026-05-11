import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useStore } from '../store';
import { fmtMoney } from '../lib/format';
import { ArrowDown, ArrowUp, Repeat } from '../components/icons';
import { Link } from 'react-router-dom';
export default function Home() {
    const { transactions, accounts, categories, accountTypes, settings, year } = useStore();
    const stats = useMemo(() => {
        const inc = transactions.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0);
        const exp = transactions.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0);
        return { income: inc, expense: exp, net: inc - exp };
    }, [transactions]);
    const byAccount = useMemo(() => {
        const map = new Map();
        for (const a of accounts)
            map.set(a.id, a.openingBalance);
        for (const t of transactions) {
            if (t.kind === 'income')
                map.set(t.accountId, (map.get(t.accountId) ?? 0) + t.amount);
            if (t.kind === 'expense')
                map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
            if (t.kind === 'transfer') {
                map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
                if (t.toAccountId)
                    map.set(t.toAccountId, (map.get(t.toAccountId) ?? 0) + t.amount);
            }
        }
        return map;
    }, [transactions, accounts]);
    const recent = useMemo(() => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8), [transactions]);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "text-xs text-slate-400 mb-2", children: ["Year ", year, " Summary"] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 text-center", children: [_jsx(Stat, { label: "Income", value: fmtMoney(stats.income, settings), accent: "text-emerald-400", icon: _jsx(ArrowDown, { className: "w-4 h-4" }) }), _jsx(Stat, { label: "Expense", value: fmtMoney(stats.expense, settings), accent: "text-rose-400", icon: _jsx(ArrowUp, { className: "w-4 h-4" }) }), _jsx(Stat, { label: "Net", value: fmtMoney(stats.net, settings), accent: stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: _jsx(Repeat, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "section-title", children: "Accounts" }), _jsx(Link, { to: "/accounts", className: "text-xs text-brand-500", children: "Manage" })] }), accounts.length === 0 ? (_jsx(EmptyHint, { to: "/accounts", label: "Add your first account" })) : (_jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: accounts.filter((a) => !a.archived).map((a) => (_jsxs("div", { className: "card flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: a.name }), _jsx("div", { className: "text-xs text-slate-400", children: accountTypeLabel(a.typeId) })] }), _jsx("div", { className: `font-semibold ${(byAccount.get(a.id) ?? 0) < 0 ? 'text-rose-400' : 'text-slate-100'}`, children: fmtMoney(byAccount.get(a.id) ?? 0, settings) })] }, a.id))) }))] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "section-title", children: "Recent" }), _jsx(Link, { to: "/charts", className: "text-xs text-brand-500", children: "View charts" })] }), recent.length === 0 ? (_jsx(EmptyHint, { to: "/add", label: "Log your first transaction" })) : (_jsx("div", { className: "card divide-y divide-slate-800 -mx-1", children: recent.map((t) => {
                            const acct = accounts.find((a) => a.id === t.accountId);
                            const cat = categories.find((c) => c.id === t.categoryId);
                            const sign = t.kind === 'income' ? '+' : t.kind === 'expense' ? '−' : '⇄';
                            const color = t.kind === 'income' ? 'text-emerald-400' :
                                t.kind === 'expense' ? 'text-rose-400' :
                                    'text-slate-300';
                            return (_jsxs("div", { className: "flex items-center justify-between px-2 py-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium truncate", children: cat ? `${cat.emoji ?? ''} ${cat.name}` : t.kind === 'transfer' ? 'Transfer' : '—' }), _jsxs("div", { className: "text-xs text-slate-400 truncate", children: [t.date, " \u00B7 ", acct?.name ?? '?', t.toAccountId ? ` → ${accounts.find((a) => a.id === t.toAccountId)?.name ?? '?'}` : '', t.note ? ` · ${t.note}` : ''] })] }), _jsxs("div", { className: `font-semibold ${color}`, children: [sign, fmtMoney(t.amount, settings).replace('-', '')] })] }, t.id));
                        }) }))] })] }));
    function accountTypeLabel(typeId) {
        return accountTypes.find((t) => t.id === typeId)?.name ?? '';
    }
}
function Stat({ label, value, accent, icon }) {
    return (_jsxs("div", { children: [_jsxs("div", { className: `flex items-center justify-center gap-1 text-xs ${accent}`, children: [icon, label] }), _jsx("div", { className: `mt-1 font-semibold ${accent}`, children: value })] }));
}
function EmptyHint({ to, label }) {
    return (_jsxs(Link, { to: to, className: "card block text-center text-slate-400 hover:text-slate-200", children: [label, " \u2192"] }));
}
