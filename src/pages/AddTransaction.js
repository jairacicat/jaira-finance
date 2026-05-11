import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { todayISO } from '../lib/format';
const tabs = [
    { kind: 'expense', label: 'Expense', color: 'bg-rose-600' },
    { kind: 'income', label: 'Income', color: 'bg-emerald-600' },
    { kind: 'transfer', label: 'Transfer', color: 'bg-slate-600' }
];
export default function AddTransaction() {
    const navigate = useNavigate();
    const { accounts, categories, addTransaction, status } = useStore();
    const [kind, setKind] = useState('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(todayISO());
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
    const activeCategories = useMemo(() => categories.filter((c) => !c.archived && c.kind === (kind === 'transfer' ? 'expense' : kind)), [categories, kind]);
    const canSubmit = (() => {
        if (!amount || Number(amount) <= 0)
            return false;
        if (!date)
            return false;
        if (!accountId)
            return false;
        if (kind === 'transfer' && (!toAccountId || toAccountId === accountId))
            return false;
        if (kind !== 'transfer' && !categoryId)
            return false;
        return true;
    })();
    async function submit() {
        if (!canSubmit)
            return;
        setBusy(true);
        try {
            await addTransaction({
                kind,
                amount: Number(amount),
                date,
                accountId,
                toAccountId: kind === 'transfer' ? toAccountId : undefined,
                categoryId: kind === 'transfer' ? undefined : categoryId,
                note: note.trim() || undefined
            });
            navigate('/');
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Add Transaction" }), _jsxs("div", { className: "card space-y-4", children: [_jsx("div", { className: "grid grid-cols-3 gap-2", children: tabs.map((t) => (_jsx("button", { onClick: () => setKind(t.kind), className: `py-2 rounded-xl text-sm font-medium transition ${kind === t.kind ? `${t.color} text-white` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`, children: t.label }, t.kind))) }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Amount" }), _jsx("input", { type: "number", inputMode: "decimal", step: "0.01", min: "0", className: "input text-2xl font-semibold", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "0.00", autoFocus: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Date" }), _jsx("input", { type: "date", className: "input", value: date, onChange: (e) => setDate(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: kind === 'transfer' ? 'From account' : 'Account' }), _jsxs("select", { className: "input", value: accountId, onChange: (e) => setAccountId(e.target.value), children: [_jsx("option", { value: "", children: "Select\u2026" }), activeAccounts.map((a) => _jsx("option", { value: a.id, children: a.name }, a.id))] })] })] }), kind === 'transfer' ? (_jsxs("div", { children: [_jsx("label", { className: "label", children: "To account" }), _jsxs("select", { className: "input", value: toAccountId, onChange: (e) => setToAccountId(e.target.value), children: [_jsx("option", { value: "", children: "Select\u2026" }), activeAccounts.filter((a) => a.id !== accountId).map((a) => (_jsx("option", { value: a.id, children: a.name }, a.id)))] })] })) : (_jsxs("div", { children: [_jsx("label", { className: "label", children: "Category" }), activeCategories.length === 0 ? (_jsxs("p", { className: "text-sm text-slate-400", children: ["No ", kind, " categories yet. Add one in ", _jsx("em", { children: "Tags" }), "."] })) : (_jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2", children: activeCategories.map((c) => (_jsxs("button", { onClick: () => setCategoryId(c.id), className: `p-2 rounded-xl text-xs border transition ${categoryId === c.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`, children: [_jsx("div", { className: "text-lg leading-tight", children: c.emoji ?? '🏷️' }), _jsx("div", { className: "truncate", children: c.name })] }, c.id))) }))] })), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Note (optional)" }), _jsx("input", { className: "input", value: note, onChange: (e) => setNote(e.target.value), placeholder: "e.g. lunch with team" })] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { className: "btn-secondary flex-1", onClick: () => navigate('/'), children: "Cancel" }), _jsx("button", { className: "btn-primary flex-1", disabled: !canSubmit || busy || status === 'syncing', onClick: submit, children: busy ? 'Saving…' : 'Save' })] })] })] }));
}
