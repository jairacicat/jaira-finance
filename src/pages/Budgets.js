import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { fmtMoney, uid } from '../lib/format';
import { Pencil, Trash, Plus } from '../components/icons';
import { Modal, FormButtons } from './Accounts';
export default function BudgetsPage() {
    const { budgets, categories, transactions, settings, saveBudget, deleteBudget } = useStore();
    const [editing, setEditing] = useState(null);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const spentByCat = useMemo(() => {
        const out = new Map();
        for (const t of transactions) {
            if (t.kind !== 'expense' || !t.categoryId)
                continue;
            if (!t.date.startsWith(monthKey))
                continue;
            out.set(t.categoryId, (out.get(t.categoryId) ?? 0) + t.amount);
        }
        return out;
    }, [transactions, monthKey]);
    const expCats = categories.filter((c) => c.kind === 'expense' && !c.archived);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h1", { className: "text-xl font-semibold", children: ["Budgets ", _jsxs("span", { className: "text-sm text-slate-400", children: ["(", monthKey, ")"] })] }), _jsxs("button", { className: "btn-ghost text-sm", onClick: () => setEditing({ id: '', categoryId: expCats[0]?.id ?? '', monthlyLimit: 0 }), children: [_jsx(Plus, { className: "w-4 h-4" }), " New"] })] }), _jsxs("div", { className: "space-y-2", children: [budgets.length === 0 && _jsx("div", { className: "card text-slate-400 text-sm", children: "No budgets set." }), budgets.map((b) => {
                        const cat = categories.find((c) => c.id === b.categoryId);
                        const spent = spentByCat.get(b.categoryId) ?? 0;
                        const pct = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0;
                        const over = spent > b.monthlyLimit;
                        return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "font-medium", children: [cat?.emoji, " ", cat?.name ?? '(deleted)'] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { className: "btn-ghost p-1.5", onClick: () => setEditing(b), children: _jsx(Pencil, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn-ghost p-1.5 text-rose-400", onClick: () => window.confirm('Delete budget?') && deleteBudget(b.id), children: _jsx(Trash, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "text-xs text-slate-400 mb-1", children: [fmtMoney(spent, settings), " of ", fmtMoney(b.monthlyLimit, settings), over && _jsxs("span", { className: "text-rose-400 ml-2", children: ["over by ", fmtMoney(spent - b.monthlyLimit, settings)] })] }), _jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`, style: { width: `${pct}%` } }) })] }, b.id));
                    })] }), editing && (_jsx(Modal, { title: editing.id ? 'Edit Budget' : 'New Budget', onClose: () => setEditing(null), children: _jsx(BudgetForm, { value: editing, cats: expCats, onCancel: () => setEditing(null), onSave: async (v) => {
                        await saveBudget(v.id ? v : { ...v, id: uid('bud_') });
                        setEditing(null);
                    } }) }))] }));
}
function BudgetForm({ value, cats, onSave, onCancel }) {
    const [v, setV] = useState(value);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Category" }), _jsxs("select", { className: "input", value: v.categoryId, onChange: (e) => setV({ ...v, categoryId: e.target.value }), children: [_jsx("option", { value: "", children: "Select\u2026" }), cats.map((c) => _jsxs("option", { value: c.id, children: [c.emoji, " ", c.name] }, c.id))] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Monthly limit" }), _jsx("input", { type: "number", step: "0.01", className: "input", value: v.monthlyLimit, onChange: (e) => setV({ ...v, monthlyLimit: Number(e.target.value) }) })] }), _jsx(FormButtons, { onCancel: onCancel, onSave: () => onSave(v), disabled: !v.categoryId || v.monthlyLimit <= 0 })] }));
}
