import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '../store';
import { uid } from '../lib/format';
import { Pencil, Trash, Plus } from '../components/icons';
import { Modal, FormButtons } from './Accounts';
export default function CategoriesPage() {
    const { categories, saveCategory, deleteCategory } = useStore();
    const [editing, setEditing] = useState(null);
    const [filter, setFilter] = useState('expense');
    const list = categories.filter((c) => c.kind === filter);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Categories" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ['expense', 'income'].map((k) => (_jsx("button", { onClick: () => setFilter(k), className: `py-2 rounded-xl text-sm font-medium ${filter === k
                        ? k === 'expense' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300'}`, children: k === 'expense' ? 'Expense' : 'Income' }, k))) }), _jsx("div", { className: "flex justify-end", children: _jsxs("button", { className: "btn-ghost text-sm", onClick: () => setEditing({ id: '', name: '', kind: filter, emoji: '', archived: false }), children: [_jsx(Plus, { className: "w-4 h-4" }), " New ", filter, " category"] }) }), _jsxs("div", { className: "card divide-y divide-slate-800 -mx-1", children: [list.length === 0 && _jsx("div", { className: "px-2 py-3 text-slate-400 text-sm", children: "No categories yet." }), list.map((c) => (_jsxs("div", { className: "flex items-center justify-between px-2 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "text-xl", children: c.emoji || '🏷️' }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium truncate", children: c.name }), c.archived && _jsx("div", { className: "text-xs text-slate-500", children: "archived" })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { className: "btn-ghost p-2", onClick: () => setEditing(c), children: _jsx(Pencil, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn-ghost p-2 text-rose-400", onClick: () => window.confirm(`Delete category "${c.name}"?`) && deleteCategory(c.id), children: _jsx(Trash, { className: "w-4 h-4" }) })] })] }, c.id)))] }), editing && (_jsx(Modal, { title: editing.id ? 'Edit Category' : 'New Category', onClose: () => setEditing(null), children: _jsx(CategoryForm, { value: editing, onCancel: () => setEditing(null), onSave: async (v) => {
                        await saveCategory(v.id ? v : { ...v, id: uid('cat_') });
                        setEditing(null);
                    } }) }))] }));
}
function CategoryForm({ value, onSave, onCancel }) {
    const [v, setV] = useState(value);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-[80px_1fr] gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Emoji" }), _jsx("input", { className: "input text-center text-xl", value: v.emoji ?? '', maxLength: 2, onChange: (e) => setV({ ...v, emoji: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Name" }), _jsx("input", { className: "input", value: v.name, onChange: (e) => setV({ ...v, name: e.target.value }), autoFocus: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Kind" }), _jsxs("select", { className: "input", value: v.kind, onChange: (e) => setV({ ...v, kind: e.target.value }), children: [_jsx("option", { value: "expense", children: "Expense" }), _jsx("option", { value: "income", children: "Income" })] })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-300", children: [_jsx("input", { type: "checkbox", checked: v.archived, onChange: (e) => setV({ ...v, archived: e.target.checked }) }), "Archived"] }), _jsx(FormButtons, { onCancel: onCancel, onSave: () => v.name && onSave(v), disabled: !v.name })] }));
}
